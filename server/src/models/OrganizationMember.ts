import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole =
  | 'owner'
  | 'admin'
  | 'project_manager'
  | 'site_engineer'
  | 'commercial_manager'
  | 'finance_officer'
  | 'client_approver';

export interface IOrganizationMember extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  user: Types.ObjectId;
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
  inviteToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: [
        'owner',
        'admin',
        'project_manager',
        'site_engineer',
        'commercial_manager',
        'finance_officer',
        'client_approver',
      ],
      default: 'site_engineer',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
      required: true,
    },
    inviteToken: { type: String },
  },
  { timestamps: true }
);

// Enforce unique user per organization
organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

export const OrganizationMember = mongoose.model<IOrganizationMember>(
  'OrganizationMember',
  organizationMemberSchema
);
