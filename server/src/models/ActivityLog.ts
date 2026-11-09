import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  project?: Types.ObjectId;
  entityType: 'Project' | 'ChangeOrder' | 'CostEstimate' | 'Approval' | 'Invoice' | 'Payment' | 'BOQItem' | 'Document';
  entityId: Types.ObjectId;
  actor: Types.ObjectId;
  action: string;
  summary: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    entityType: {
      type: String,
      enum: ['Project', 'ChangeOrder', 'CostEstimate', 'Approval', 'Invoice', 'Payment', 'BOQItem', 'Document'],
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    summary: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now, immutable: true, index: true },
  },
  { timestamps: false }
);

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

