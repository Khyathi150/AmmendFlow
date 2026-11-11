import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Readable } from 'stream';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { io as socketClient, Socket as ClientSocket } from 'socket.io-client';
import { buildEnvConfig, env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { isOriginAllowed } from '../config/cors.js';
import { createApp } from '../app.js';
import { initSocketIO } from '../config/socket.js';
import { createStorageService } from '../services/storage.service.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';

const VALID_PROD_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  PORT: '8080',
  HOST: '0.0.0.0',
  MONGODB_URI: 'mongodb+srv://produser:s3cur3p4ss@cluster0.example.mongodb.net/amendflow',
  JWT_SECRET: 'b9c4e7f2a1d8036f45e98c12ab74de90f123456789abcdef',
  CLIENT_URL: 'https://app.amendflow.com/',
  STORAGE_PROVIDER: 's3',
  S3_BUCKET: 'amendflow-prod-docs',
  S3_REGION: 'ap-south-1',
  S3_ACCESS_KEY_ID: 'AKIAEXAMPLEACCESSKEY12',
  S3_SECRET_ACCESS_KEY: 'exampleSecretAccessKey0123456789abcdef',
};

describe('Production Security Config, CORS, Database & S3 Object Storage', () => {
  it('1. Requires a strong non-placeholder JWT_SECRET in production and rejects weak fallbacks', () => {
    const valid = buildEnvConfig(VALID_PROD_ENV);
    assert.equal(valid.JWT_SECRET, VALID_PROD_ENV.JWT_SECRET);
    assert.equal(valid.HOST, '0.0.0.0');
    assert.equal(valid.PORT, 8080);

    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, JWT_SECRET: '' }),
      /JWT_SECRET/
    );
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, JWT_SECRET: 'short-secret-123' }),
      /JWT_SECRET/
    );
    assert.throws(
      () =>
        buildEnvConfig({
          ...VALID_PROD_ENV,
          JWT_SECRET: 'amendflow-super-secure-production-jwt-secret-2026',
        }),
      /JWT_SECRET/
    );
  });

  it('2. Requires valid MONGODB_URI in production and refuses silent fallback to MongoMemoryServer', async () => {
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, MONGODB_URI: '' }),
      /MONGODB_URI/
    );
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, MONGODB_URI: 'http://not-mongo:27017' }),
      /MONGODB_URI/
    );

    await assert.rejects(
      async () => connectDB({ NODE_ENV: 'production', MONGODB_URI: '' }),
      /MONGODB_URI/
    );

    await assert.rejects(
      async () =>
        connectDB({
          NODE_ENV: 'development',
          MONGODB_URI: 'mongodb://127.0.0.1:59999/unreachable?serverSelectionTimeoutMS=300',
        })
    );
  });

  it('3. Enforces strict production CORS matching exact CLIENT_URL only (no allow-all fallback)', async () => {
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, CLIENT_URL: '' }),
      /CLIENT_URL/
    );

    const prodConfig = buildEnvConfig(VALID_PROD_ENV);
    assert.equal(prodConfig.CLIENT_URL, 'https://app.amendflow.com');

    assert.equal(isOriginAllowed('https://app.amendflow.com', prodConfig), true);
    assert.equal(isOriginAllowed('https://app.amendflow.com/', prodConfig), true);
    assert.equal(isOriginAllowed('http://localhost:5173', prodConfig), false);
    assert.equal(isOriginAllowed('https://evil-attacker.com', prodConfig), false);

    const prodApp = createApp(prodConfig);

    const allowedRes = await request(prodApp)
      .get('/api/health')
      .set('Origin', 'https://app.amendflow.com');
    assert.equal(allowedRes.status, 200);
    assert.equal(allowedRes.headers['access-control-allow-origin'], 'https://app.amendflow.com');
    assert.equal(allowedRes.headers['access-control-allow-credentials'], 'true');

    const blockedRes = await request(prodApp)
      .get('/api/health')
      .set('Origin', 'https://evil-attacker.com');
    assert.equal(blockedRes.headers['access-control-allow-origin'], undefined);

    const blockedLocalhostRes = await request(prodApp)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    assert.equal(blockedLocalhostRes.headers['access-control-allow-origin'], undefined);
  });

  it('5. Supports configurable S3-compatible persistent object storage in production', async () => {
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, STORAGE_PROVIDER: 'local' }),
      /STORAGE_PROVIDER=local/
    );
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, S3_BUCKET: '' }),
      /S3_BUCKET/
    );

    const prodConfig = buildEnvConfig(VALID_PROD_ENV);
    const storedObjects = new Map<string, { body: Buffer; contentType: string }>();

    const mockS3Client = {
      async send(command: any) {
        const name = command.constructor.name;
        const input = command.input;
        if (name === 'PutObjectCommand') {
          storedObjects.set(input.Key, {
            body: Buffer.isBuffer(input.Body) ? input.Body : Buffer.from(input.Body),
            contentType: input.ContentType,
          });
          return { ETag: '"mock-etag"' };
        }
        if (name === 'GetObjectCommand') {
          const item = storedObjects.get(input.Key);
          if (!item) {
            const err: any = new Error('NoSuchKey');
            err.name = 'NoSuchKey';
            throw err;
          }
          return {
            Body: Readable.from(item.body),
            ContentType: item.contentType,
            ContentLength: item.body.length,
          };
        }
        if (name === 'DeleteObjectCommand') {
          storedObjects.delete(input.Key);
          return {};
        }
        throw new Error(`Unexpected command ${name}`);
      },
    };

    const s3Service = createStorageService(
      prodConfig,
      mockS3Client,
      async (_client, cmd) =>
        `https://amendflow-prod-docs.s3.ap-south-1.amazonaws.com/${cmd.input.Key}?X-Amz-Signature=signed`
    );

    assert.equal(s3Service.provider, 's3');

    const payload = Buffer.from('%PDF-1.4 S3 Persistent Structural Drawing');
    const uploaded = await s3Service.uploadObject({
      orgId: 'org123',
      projectId: 'proj456',
      filename: 'drawing-rev2.pdf',
      buffer: payload,
      mimeType: 'application/pdf',
    });

    assert.equal(uploaded.storageProvider, 's3');
    assert.equal(uploaded.storageKey, 'orgs/org123/projects/proj456/drawing-rev2.pdf');

    const signedUrl = await s3Service.getSignedDownloadUrl(
      's3',
      uploaded.storageKey,
      'Original.pdf',
      false
    );
    assert.ok(signedUrl?.startsWith('https://amendflow-prod-docs.s3.ap-south-1.amazonaws.com/'));

    const streamRes = await s3Service.getObjectStream('s3', uploaded.storageKey);
    const chunks: Buffer[] = [];
    for await (const chunk of streamRes.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    assert.equal(Buffer.concat(chunks).toString('utf8'), payload.toString('utf8'));
    assert.equal(streamRes.contentType, 'application/pdf');
  });
});

describe('Socket.IO Authentication & Room Authorization Enforcement', () => {
  let httpServer: http.Server;
  let serverUrl: string;
  let orgAId: string;
  let orgBId: string;
  let projectAId: string;
  let projectAUnassignedId: string;
  let orgAOwnerToken: string;
  let orgASiteEngToken: string;
  let orgBToken: string;

  const openClients: ClientSocket[] = [];

  function connectSocket(token?: string): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const client = socketClient(serverUrl, {
        auth: token ? { token } : undefined,
        transports: ['websocket'],
        reconnection: false,
      });
      openClients.push(client);
      client.on('connect', () => resolve(client));
      client.on('connect_error', (err) => {
        client.close();
        reject(err);
      });
    });
  }

  function emitJoin(socket: ClientSocket, event: 'join_org' | 'join_project', targetId: string) {
    return new Promise<{ ok: boolean; room?: string; error?: string }>((resolve) => {
      socket.emit(event, targetId, (ack: any) => resolve(ack));
    });
  }

  before(async () => {
    await connectDB();

    const [orgA, orgB] = await Promise.all([
      Organization.create({ name: 'Socket Tenant A', currency: 'INR' }),
      Organization.create({ name: 'Socket Tenant B', currency: 'INR' }),
    ]);
    orgAId = orgA._id.toString();
    orgBId = orgB._id.toString();

    const [ownerA, engA, userB] = await Promise.all([
      User.create({
        name: 'Owner A',
        email: `owner-a-${Date.now()}@test.com`,
        passwordHash: 'hash',
        activeOrgId: orgA._id,
      }),
      User.create({
        name: 'Site Eng A',
        email: `eng-a-${Date.now()}@test.com`,
        passwordHash: 'hash',
        activeOrgId: orgA._id,
      }),
      User.create({
        name: 'User B',
        email: `user-b-${Date.now()}@test.com`,
        passwordHash: 'hash',
        activeOrgId: orgB._id,
      }),
    ]);

    await Promise.all([
      OrganizationMember.create({ organization: orgA._id, user: ownerA._id, role: 'owner', status: 'active' }),
      OrganizationMember.create({ organization: orgA._id, user: engA._id, role: 'site_engineer', status: 'active' }),
      OrganizationMember.create({ organization: orgB._id, user: userB._id, role: 'owner', status: 'active' }),
    ]);

    const [proj1, proj2] = await Promise.all([
      Project.create({
        organization: orgA._id,
        name: 'Assigned Metro Corridor',
        code: `PRJ-SOCK1-${Date.now().toString().slice(-4)}`,
        clientName: 'BMRCL',
        contractorName: 'Tenant A',
        location: { city: 'Bengaluru', state: 'Karnataka' },
        startDate: new Date(),
        targetEndDate: new Date(Date.now() + 86400000),
        originalContractPaise: 100000000,
        status: 'Active',
      }),
      Project.create({
        organization: orgA._id,
        name: 'Unassigned Tunnel Package',
        code: `PRJ-SOCK2-${Date.now().toString().slice(-4)}`,
        clientName: 'MMRDA',
        contractorName: 'Tenant A',
        location: { city: 'Mumbai', state: 'Maharashtra' },
        startDate: new Date(),
        targetEndDate: new Date(Date.now() + 86400000),
        originalContractPaise: 200000000,
        status: 'Active',
      }),
    ]);
    projectAId = proj1._id.toString();
    projectAUnassignedId = proj2._id.toString();

    await ProjectMember.create({ project: proj1._id, user: engA._id, projectRole: 'engineer' });

    orgAOwnerToken = jwt.sign({ userId: ownerA._id.toString(), activeOrgId: orgAId }, env.JWT_SECRET);
    orgASiteEngToken = jwt.sign({ userId: engA._id.toString(), activeOrgId: orgAId }, env.JWT_SECRET);
    orgBToken = jwt.sign({ userId: userB._id.toString(), activeOrgId: orgBId }, env.JWT_SECRET);

    httpServer = http.createServer(createApp(env));
    initSocketIO(httpServer, env);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        const addr = httpServer.address() as any;
        serverUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    openClients.forEach((c) => {
      if (c.connected) c.close();
    });
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await disconnectDB();
  });

  it('4a. Rejects unauthenticated Socket.IO connections and forged tokens', async () => {
    await assert.rejects(() => connectSocket(), /UNAUTHORIZED/i);
    await assert.rejects(() => connectSocket('invalid.jwt.token'), /UNAUTHORIZED/i);
  });

  it('4b. Blocks cross-tenant org and project room joins', async () => {
    const clientB = await connectSocket(orgBToken);

    const orgJoin = await emitJoin(clientB, 'join_org', orgAId);
    assert.equal(orgJoin.ok, false);
    assert.equal(orgJoin.error, 'FORBIDDEN');

    const projJoin = await emitJoin(clientB, 'join_project', projectAId);
    assert.equal(projJoin.ok, false);
    assert.equal(projJoin.error, 'FORBIDDEN');
  });

  it('4c. Enforces project membership for non-admin roles while allowing authorized members and owners', async () => {
    const engSocket = await connectSocket(orgASiteEngToken);

    const engOrgJoin = await emitJoin(engSocket, 'join_org', orgAId);
    assert.equal(engOrgJoin.ok, true);

    const assignedJoin = await emitJoin(engSocket, 'join_project', projectAId);
    assert.equal(assignedJoin.ok, true);
    assert.equal(assignedJoin.room, `project_${projectAId}`);

    const unassignedJoin = await emitJoin(engSocket, 'join_project', projectAUnassignedId);
    assert.equal(unassignedJoin.ok, false);
    assert.equal(unassignedJoin.error, 'PROJECT_MEMBERSHIP_REQUIRED');

    const ownerSocket = await connectSocket(orgAOwnerToken);
    const ownerUnassignedJoin = await emitJoin(ownerSocket, 'join_project', projectAUnassignedId);
    assert.equal(ownerUnassignedJoin.ok, true);
  });
});
