import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env, EnvConfig } from './env.js';
import { isOriginAllowed } from './cors.js';
import { User } from '../models/User.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';

interface SocketJwtPayload {
  userId: string;
  activeOrgId?: string;
}

export interface RoomJoinAck {
  ok: boolean;
  room?: string;
  error?: string;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

function extractSocketToken(socket: Socket): string | undefined {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.startsWith('Bearer ') ? authToken.slice(7).trim() : authToken.trim();
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookies(socket.handshake.headers?.cookie);
  if (cookies.token) {
    return cookies.token;
  }

  return undefined;
}

let activeIO: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return activeIO;
}

export function initSocketIO(
  httpServer: HttpServer,
  config: Pick<EnvConfig, 'NODE_ENV' | 'CLIENT_URL' | 'JWT_SECRET'> = env
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin, config)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by Socket.IO CORS policy'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Require valid authenticated session on every Socket.IO connection
  io.use(async (socket, next) => {
    try {
      const token = extractSocketToken(socket);
      if (!token) {
        return next(new Error('UNAUTHORIZED: Authentication token required'));
      }

      let decoded: SocketJwtPayload;
      try {
        decoded = jwt.verify(token, config.JWT_SECRET) as SocketJwtPayload;
      } catch {
        return next(new Error('UNAUTHORIZED: Invalid or expired token'));
      }

      if (!decoded?.userId || !Types.ObjectId.isValid(decoded.userId)) {
        return next(new Error('UNAUTHORIZED: Malformed token subject'));
      }

      const user = await User.findById(decoded.userId).select('_id name email activeOrgId');
      if (!user) {
        return next(new Error('UNAUTHORIZED: User not found'));
      }

      socket.data.userId = user._id.toString();
      socket.data.userEmail = user.email;
      socket.data.activeOrgId = decoded.activeOrgId || user.activeOrgId?.toString();

      return next();
    } catch (err) {
      return next(new Error('UNAUTHORIZED: Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_org', async (orgId: string, ack?: (resp: RoomJoinAck) => void) => {
      try {
        if (typeof orgId !== 'string' || !Types.ObjectId.isValid(orgId)) {
          const resp: RoomJoinAck = { ok: false, error: 'INVALID_ORGANIZATION_ID' };
          socket.emit('room_error', { event: 'join_org', ...resp });
          ack?.(resp);
          return;
        }

        const membership = await OrganizationMember.findOne({
          organization: new Types.ObjectId(orgId),
          user: new Types.ObjectId(socket.data.userId),
          status: 'active',
        });

        if (!membership) {
          const resp: RoomJoinAck = { ok: false, error: 'FORBIDDEN' };
          socket.emit('room_error', { event: 'join_org', ...resp });
          ack?.(resp);
          return;
        }

        const room = `org_${orgId}`;
        await socket.join(room);
        ack?.({ ok: true, room });
      } catch (err) {
        const resp: RoomJoinAck = { ok: false, error: 'JOIN_ORG_FAILED' };
        socket.emit('room_error', { event: 'join_org', ...resp });
        ack?.(resp);
      }
    });

    socket.on('join_project', async (projectId: string, ack?: (resp: RoomJoinAck) => void) => {
      try {
        if (typeof projectId !== 'string' || !Types.ObjectId.isValid(projectId)) {
          const resp: RoomJoinAck = { ok: false, error: 'INVALID_PROJECT_ID' };
          socket.emit('room_error', { event: 'join_project', ...resp });
          ack?.(resp);
          return;
        }

        const project = await Project.findById(projectId).select('_id organization');
        if (!project) {
          const resp: RoomJoinAck = { ok: false, error: 'PROJECT_NOT_FOUND' };
          socket.emit('room_error', { event: 'join_project', ...resp });
          ack?.(resp);
          return;
        }

        const userObjectId = new Types.ObjectId(socket.data.userId);
        const orgMembership = await OrganizationMember.findOne({
          organization: project.organization,
          user: userObjectId,
          status: 'active',
        });

        if (!orgMembership) {
          const resp: RoomJoinAck = { ok: false, error: 'FORBIDDEN' };
          socket.emit('room_error', { event: 'join_project', ...resp });
          ack?.(resp);
          return;
        }

        // Organization owners/admins have access across org projects; other roles require project membership
        if (orgMembership.role !== 'owner' && orgMembership.role !== 'admin') {
          const projectMembership = await ProjectMember.findOne({
            project: project._id,
            user: userObjectId,
          });
          if (!projectMembership) {
            const resp: RoomJoinAck = { ok: false, error: 'PROJECT_MEMBERSHIP_REQUIRED' };
            socket.emit('room_error', { event: 'join_project', ...resp });
            ack?.(resp);
            return;
          }
        }

        const room = `project_${projectId}`;
        await socket.join(room);
        ack?.({ ok: true, room });
      } catch (err) {
        const resp: RoomJoinAck = { ok: false, error: 'JOIN_PROJECT_FAILED' };
        socket.emit('room_error', { event: 'join_project', ...resp });
        ack?.(resp);
      }
    });
  });

  activeIO = io;
  return io;
}
