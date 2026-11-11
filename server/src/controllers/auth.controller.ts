import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import {
  registerSchema,
  loginSchema,
  switchOrgSchema,
} from '../validators/auth.validator.js';

function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function generateToken(userId: Types.ObjectId, activeOrgId?: Types.ObjectId): string {
  return jwt.sign(
    {
      userId: userId.toString(),
      activeOrgId: activeOrgId ? activeOrgId.toString() : undefined,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const { name, email, password, organizationName, phone } = parseResult.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, 'USER_EXISTS', 'An account with this email address already exists.', 409);
      return;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      phone,
    });
    await user.save();

    // Create organization
    const org = new Organization({
      name: organizationName,
      legalEntityName: organizationName,
      currency: 'INR',
    });
    await org.save();

    // Make creator the organization Owner
    const membership = new OrganizationMember({
      organization: org._id,
      user: user._id,
      role: 'owner',
      status: 'active',
    });
    await membership.save();

    // Link active organization to user
    user.activeOrgId = org._id;
    await user.save();

    const token = generateToken(user._id, org._id);
    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
        activeOrganization: {
          _id: org._id,
          name: org.name,
          currency: org.currency,
          role: 'owner',
        },
        token,
      },
      201,
      'Organization and account registered successfully'
    );
  } catch (error: any) {
    console.error('[Register] Error:', error);
    sendError(res, 'REGISTER_FAILED', error.message || 'Failed to complete registration', 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email });
    if (!user) {
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
      return;
    }

    // Find all active memberships
    const memberships = await OrganizationMember.find({
      user: user._id,
      status: 'active',
    }).populate('organization');

    if (memberships.length === 0) {
      sendError(res, 'NO_ORGANIZATION', 'User has no active organization memberships.', 403);
      return;
    }

    // Determine target active org
    let activeMembership = memberships.find((m) =>
      user.activeOrgId && m.organization && (m.organization as any)._id.toString() === user.activeOrgId.toString()
    );
    if (!activeMembership) {
      activeMembership = memberships[0];
      user.activeOrgId = (activeMembership.organization as any)._id;
      await user.save();
    }

    const orgDoc = activeMembership.organization as any;
    const token = generateToken(user._id, orgDoc._id);
    setAuthCookie(res, token);

    const organizations = memberships.map((m: any) => ({
      _id: m.organization._id,
      name: m.organization.name,
      currency: m.organization.currency,
      role: m.role,
    }));

    sendSuccess(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      activeOrganization: {
        _id: orgDoc._id,
        name: orgDoc.name,
        currency: orgDoc.currency,
        role: activeMembership.role,
      },
      organizations,
      token,
    });
  } catch (error: any) {
    console.error('[Login] Error:', error);
    sendError(res, 'LOGIN_FAILED', error.message || 'Login failed', 500);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  sendSuccess(res, { message: 'Logged out successfully' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'UNAUTHENTICATED', 'No authenticated session', 401);
      return;
    }

    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      sendError(res, 'NOT_FOUND', 'User record not found', 404);
      return;
    }

    const memberships = await OrganizationMember.find({
      user: user._id,
      status: 'active',
    }).populate('organization');

    const organizations = memberships.map((m: any) => ({
      _id: m.organization._id,
      name: m.organization.name,
      currency: m.organization.currency,
      role: m.role,
    }));

    let currentOrg = null;
    if (req.orgId) {
      const activeMember = memberships.find(
        (m: any) => m.organization._id.toString() === req.orgId?.toString()
      );
      if (activeMember) {
        currentOrg = {
          _id: (activeMember.organization as any)._id,
          name: (activeMember.organization as any).name,
          currency: (activeMember.organization as any).currency,
          role: activeMember.role,
        };
      }
    }

    sendSuccess(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      activeOrganization: currentOrg,
      organizations,
    });
  } catch (error: any) {
    console.error('[GetMe] Error:', error);
    sendError(res, 'FETCH_ME_FAILED', 'Failed to retrieve user context', 500);
  }
}

export async function switchOrganization(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = switchOrgSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const { organizationId } = parseResult.data;
    if (!Types.ObjectId.isValid(organizationId)) {
      sendError(res, 'INVALID_ID', 'Invalid organization ID format', 400);
      return;
    }

    const membership = await OrganizationMember.findOne({
      user: req.user?._id,
      organization: new Types.ObjectId(organizationId),
      status: 'active',
    }).populate('organization');

    if (!membership) {
      sendError(res, 'ACCESS_DENIED', 'You do not have access to this organization.', 403);
      return;
    }

    // Update user activeOrgId
    await User.findByIdAndUpdate(req.user?._id, { activeOrgId: membership.organization._id });

    const token = generateToken(req.user!._id, (membership.organization as any)._id);
    setAuthCookie(res, token);

    sendSuccess(res, {
      activeOrganization: {
        _id: (membership.organization as any)._id,
        name: (membership.organization as any).name,
        currency: (membership.organization as any).currency,
        role: membership.role,
      },
      token,
    });
  } catch (error: any) {
    console.error('[SwitchOrg] Error:', error);
    sendError(res, 'SWITCH_FAILED', 'Failed to switch organization workspace', 500);
  }
}

