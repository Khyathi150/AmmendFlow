import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProjectRole = 'manager' | 'engineer' | 'estimator' | 'finance' | 'client_rep';

export interface IProjectMember extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  user: Types.ObjectId;
  projectRole: ProjectRole;
  assignedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectRole: {
      type: String,
      enum: ['manager', 'engineer', 'estimator', 'finance', 'client_rep'],
      default: 'engineer',
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export const ProjectMember = mongoose.model<IProjectMember>('ProjectMember', projectMemberSchema);
