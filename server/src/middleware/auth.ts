import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { OrganizationMember, UserRole } from '../models/OrganizationMember.js';
import { sendError } from '../utils/responseEnvelope.js';

interface JwtPayload {
  userId: string;
  activeOrgId?: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 'UNAUTHENTICATED', 'Authentication required. Please log in.', 401);
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (jwtErr) {
      sendError(res, 'INVALID_TOKEN', 'Session has expired or is invalid. Please log in again.', 401);
      return;
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      sendError(res, 'USER_NOT_FOUND', 'User record could not be found.', 401);
      return;
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };

    // Determine target organization context
    const targetOrgId = decoded.activeOrgId || (user.activeOrgId ? user.activeOrgId.toString() : undefined);

    if (targetOrgId && Types.ObjectId.isValid(targetOrgId)) {
      const membership = await OrganizationMember.findOne({
        user: user._id,
        organization: new Types.ObjectId(targetOrgId),
        status: 'active',
      });

      if (membership) {
        req.orgId = membership.organization;
        req.userRole = membership.role as UserRole;
      }
    }

    // If no active org context found, locate user's first available active organization
    if (!req.orgId) {
      const fallbackMember = await OrganizationMember.findOne({
        user: user._id,
        status: 'active',
      });
      if (fallbackMember) {
        req.orgId = fallbackMember.organization;
        req.userRole = fallbackMember.role as UserRole;
        user.activeOrgId = fallbackMember.organization;
        await user.save();
      }
    }

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    sendError(res, 'AUTH_INTERNAL_ERROR', 'Authentication verification encountered an error', 500);
  }
}

/**
 * Ensures that the request is running in an active organization tenant context.
 */
export function requireOrgContext(req: Request, res: Response, next: NextFunction): void {
  if (!req.orgId) {
    sendError(
      res,
      'ORG_CONTEXT_REQUIRED',
      'An active organization workspace must be selected to access this resource.',
      403
    );
    return;
  }
  next();
}

/**
 * Middleware generator to enforce RBAC permissions.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      sendError(res, 'FORBIDDEN', 'No role assigned in the active organization.', 403);
      return;
    }

    // 'owner' has omnipotent access across all organization actions
    if (req.userRole === 'owner') {
      next();
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      sendError(
        res,
        'INSUFFICIENT_PERMISSIONS',
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.userRole}`,
        403
      );
      return;
    }

    next();
  };
}
