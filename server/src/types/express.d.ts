import { Types } from 'mongoose';
import { UserRole } from '../models/OrganizationMember.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        name: string;
        email: string;
        avatarUrl?: string;
      };
      orgId?: Types.ObjectId;
      userRole?: UserRole;
    }
  }
}
