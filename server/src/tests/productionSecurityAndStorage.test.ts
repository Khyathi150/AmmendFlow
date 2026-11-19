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
import { initSocketIO, RoomJoinAck } from '../config/socket.js';
import { createStorageService, CloudinaryAdapter } from '../services/storage.service.js';
import { seedDatabase } from '../seeds/seed.js';
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
  STORAGE_PROVIDER: 'cloudinary',
  CLOUDINARY_CLOUD_NAME: 'amendflow-cloud',
  CLOUDINARY_API_KEY: '9988776655443322',
  CLOUDINARY_API_SECRET: 'cloudinary_secret_key_for_prod_test',
};

describe('Production Security Config, CORS, Database & Cloudinary Storage', () => {
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
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://127.0.0.1:59999/unreachable?serverSelectionTimeoutMS=300',
        })
    );

    await assert.rejects(
      async () =>
        connectDB({
          NODE_ENV: 'development',
          MONGODB_URI: 'mongodb://127.0.0.1:59999/unreachable?serverSelectionTimeoutMS=300',
        })
    );
  });

  it('3. Enforces strict production CORS matching exact CLIENT_URL only and allows localhost in development only', async () => {
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

    // Development preserves localhost access while rejecting untrusted external origins
    const devConfig = buildEnvConfig({
      NODE_ENV: 'development',
      CLIENT_URL: 'http://localhost:5173',
    });
    const devApp = createApp(devConfig);

    const devLocalRes = await request(devApp)
      .get('/api/health')
      .set('Origin', 'http://127.0.0.1:4173');
    assert.equal(devLocalRes.headers['access-control-allow-origin'], 'http://127.0.0.1:4173');

    const devExternalBlocked = await request(devApp)
      .get('/api/health')
      .set('Origin', 'https://evil-attacker.com');
    assert.equal(devExternalBlocked.headers['access-control-allow-origin'], undefined);
  });

  it('5. Supports configurable Cloudinary persistent storage in production while keeping local uploads in dev', async () => {
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, STORAGE_PROVIDER: 'local' }),
      /STORAGE_PROVIDER=local/
    );
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, CLOUDINARY_CLOUD_NAME: '' }),
      /CLOUDINARY_CLOUD_NAME/
    );
    assert.throws(
      () => buildEnvConfig({ ...VALID_PROD_ENV, CLOUDINARY_API_SECRET: '' }),
      /CLOUDINARY_API_SECRET/
    );

    const parsedFromUrl = buildEnvConfig({
      ...VALID_PROD_ENV,
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      CLOUDINARY_URL: 'cloudinary://11223344:supersecret@amendflow-url-cloud',
    });
    assert.equal(parsedFromUrl.CLOUDINARY_CLOUD_NAME, 'amendflow-url-cloud');
    assert.equal(parsedFromUrl.CLOUDINARY_API_KEY, '11223344');
    assert.equal(parsedFromUrl.CLOUDINARY_API_SECRET, 'supersecret');

    const prodConfig = buildEnvConfig(VALID_PROD_ENV);
    const storedAssets = new Map<string, { buffer: Buffer; url: string }>();

    const mockCloudinary: CloudinaryAdapter = {
      async uploadBuffer({ buffer, folder, publicId }) {
        const key = `${folder}/${publicId}`;
        const url = `https://res.cloudinary.com/amendflow-cloud/image/upload/v1/${key}.pdf`;
        storedAssets.set(key, { buffer, url });
        return {
          public_id: key,
          secure_url: url,
          resource_type: 'image',
        };
      },
      buildUrl(publicId, options) {
        const flag = options?.asAttachment ? 'fl_attachment/' : '';
        return `https://res.cloudinary.com/amendflow-cloud/${options?.resourceType || 'image'}/upload/${flag}${publicId}`;
      },
      async destroy(publicId) {
        storedAssets.delete(publicId);
      },
    };

    const mockFetch = async (url: string): Promise<Response> => {
      const matched = Array.from(storedAssets.values()).find((entry) => entry.url === url);
      if (!matched) {
        return new Response(null, { status: 404 });
      }
      return new Response(new Uint8Array(matched.buffer), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(matched.buffer.length),
        },
      });
    };

    const cloudService = createStorageService(prodConfig, mockCloudinary, mockFetch);
    assert.equal(cloudService.provider, 'cloudinary');

    const payload = Buffer.from('%PDF-1.4 Cloudinary Persistent Structural Drawing');
    const uploaded = await cloudService.uploadObject({
      orgId: 'org123',
      projectId: 'proj456',
      filename: 'drawing-rev2.pdf',
      buffer: payload,
      mimeType: 'application/pdf',
    });

    assert.equal(uploaded.storageProvider, 'cloudinary');
    assert.equal(uploaded.storageKey, 'amendflow/orgs/org123/projects/proj456/drawing-rev2');
    assert.ok(uploaded.storageUrl?.startsWith('https://res.cloudinary.com/amendflow-cloud/'));

    const downloadUrl = await cloudService.getDownloadUrl('cloudinary', uploaded.storageKey, false, {
      storageUrl: uploaded.storageUrl,
      resourceType: uploaded.resourceType,
    });
    assert.equal(downloadUrl, uploaded.storageUrl);

    const streamRes = await cloudService.getObjectStream('cloudinary', uploaded.storageKey, {
      storageUrl: uploaded.storageUrl,
      resourceType: uploaded.resourceType,
    });
    const chunks: Buffer[] = [];
    for await (const chunk of streamRes.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    assert.equal(Buffer.concat(chunks).toString('utf8'), payload.toString('utf8'));
    assert.equal(streamRes.contentType, 'application/pdf');

    await cloudService.deleteObject('cloudinary', uploaded.storageKey, {
      resourceType: uploaded.resourceType,
    });
    assert.equal(storedAssets.size, 0);
  });
});

describe('Demo Seeding Safety & Production Guards', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  it('6. Blocks seedDatabase in production, without explicit opt-in, and refuses auto-deleting existing collections', async () => {
    await assert.rejects(
      async () =>
        seedDatabase({
          nodeEnv: 'production',
          allowDemoSeed: true,
          demoPassword: 'StrongLocalPassword1!',
        }),
      /disabled when NODE_ENV=production/i
    );

    await assert.rejects(
      async () =>
        seedDatabase({
          nodeEnv: 'development',
          allowDemoSeed: false,
          demoPassword: 'StrongLocalPassword1!',
        }),
      /ALLOW_DEMO_SEED=true/i
    );

    await assert.rejects(
      async () =>
        seedDatabase({
          nodeEnv: 'development',
          allowDemoSeed: true,
          demoPassword: '',
        }),
      /SEED_DEMO_PASSWORD/i
    );

    await seedDatabase({
      nodeEnv: 'development',
      mongoUri: '',
      allowDemoSeed: true,
      demoPassword: 'ControlledLocalSeedPass!99',
    });

    const userCountAfterSeed = await User.estimatedDocumentCount();
    assert.equal(userCountAfterSeed, 6);

    await assert.rejects(
      async () =>
        seedDatabase({
          nodeEnv: 'development',
          mongoUri: '',
          allowDemoSeed: true,
          demoPassword: 'ControlledLocalSeedPass!99',
          hasResetFlag: false,
          confirmResetLocal: false,
        }),
      /Aborting without deleting collections/i
    );

    await assert.rejects(
      async () =>
        seedDatabase({
          nodeEnv: 'development',
          mongoUri: 'mongodb+srv://produser:pw@cluster0.mongodb.net/amendflow',
          allowDemoSeed: true,
          demoPassword: 'ControlledLocalSeedPass!99',
          hasResetFlag: true,
          confirmResetLocal: true,
        }),
      /Existing data detected on remote\/Atlas database/i
    );
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
  let orgASuspendedToken: string;
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
      client.on('connect_error', (err: Error) => {
        client.close();
        reject(err);
      });
    });
  }

  function emitJoin(socket: ClientSocket, event: 'join_org' | 'join_project', targetId: string) {
    return new Promise<RoomJoinAck>((resolve) => {
      socket.emit(event, targetId, (ack: RoomJoinAck) => resolve(ack));
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

    const [ownerA, engA, suspendedA, userB] = await Promise.all([
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
        name: 'Suspended A',
        email: `suspended-a-${Date.now()}@test.com`,
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
      OrganizationMember.create({ organization: orgA._id, user: suspendedA._id, role: 'owner', status: 'suspended' }),
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
    orgASuspendedToken = jwt.sign({ userId: suspendedA._id.toString(), activeOrgId: orgAId }, env.JWT_SECRET);
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

  it('4b. Blocks cross-tenant and suspended org/project room joins', async () => {
    const clientB = await connectSocket(orgBToken);

    const orgJoin = await emitJoin(clientB, 'join_org', orgAId);
    assert.equal(orgJoin.ok, false);
    assert.equal(orgJoin.error, 'FORBIDDEN');

    const projJoin = await emitJoin(clientB, 'join_project', projectAId);
    assert.equal(projJoin.ok, false);
    assert.equal(projJoin.error, 'FORBIDDEN');

    const suspendedSocket = await connectSocket(orgASuspendedToken);
    const suspendedOrgJoin = await emitJoin(suspendedSocket, 'join_org', orgAId);
    assert.equal(suspendedOrgJoin.ok, false);
    assert.equal(suspendedOrgJoin.error, 'FORBIDDEN');

    const suspendedProjJoin = await emitJoin(suspendedSocket, 'join_project', projectAId);
    assert.equal(suspendedProjJoin.ok, false);
    assert.equal(suspendedProjJoin.error, 'FORBIDDEN');
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

  it('4d. Restricts Socket.IO CORS in production to exact CLIENT_URL origin only', async () => {
    const prodConfig = buildEnvConfig(VALID_PROD_ENV);
    const prodServer = http.createServer(createApp(prodConfig));
    initSocketIO(prodServer, prodConfig);

    await new Promise<void>((resolve) => {
      prodServer.listen(0, '127.0.0.1', () => resolve());
    });

    try {
      const addr = prodServer.address() as any;
      const prodSocketUrl = `http://127.0.0.1:${addr.port}`;
      const prodToken = jwt.sign(
        { userId: new (await import('mongoose')).Types.ObjectId().toString() },
        prodConfig.JWT_SECRET
      );

      // Disallowed origins are rejected at CORS layer before auth
      await assert.rejects(() => {
        return new Promise<ClientSocket>((resolve, reject) => {
          const client = socketClient(prodSocketUrl, {
            auth: { token: prodToken },
            extraHeaders: { origin: 'https://evil-attacker.com' },
            transports: ['polling'],
            reconnection: false,
          });
          client.on('connect', () => {
            client.close();
            resolve(client);
          });
          client.on('connect_error', (err: Error) => {
            client.close();
            reject(err);
          });
        });
      });

      await assert.rejects(() => {
        return new Promise<ClientSocket>((resolve, reject) => {
          const client = socketClient(prodSocketUrl, {
            auth: { token: prodToken },
            extraHeaders: { origin: 'http://localhost:5173' },
            transports: ['polling'],
            reconnection: false,
          });
          client.on('connect', () => {
            client.close();
            resolve(client);
          });
          client.on('connect_error', (err: Error) => {
            client.close();
            reject(err);
          });
        });
      });

      // Exact CLIENT_URL passes CORS check cleanly (and proceeds to JWT user lookup)
      const allowedErr = await new Promise<Error>((resolve, reject) => {
        const client = socketClient(prodSocketUrl, {
          auth: { token: prodToken },
          extraHeaders: { origin: 'https://app.amendflow.com' },
          transports: ['polling'],
          reconnection: false,
        });
        client.on('connect', () => {
          client.close();
          reject(new Error('Expected missing-user auth error after passing CORS'));
        });
        client.on('connect_error', (err: Error) => {
          client.close();
          resolve(err);
        });
      });
      assert.match(allowedErr.message, /UNAUTHORIZED/i);
    } finally {
      await new Promise<void>((resolve) => prodServer.close(() => resolve()));
    }
  });
});
