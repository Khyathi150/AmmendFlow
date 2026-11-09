import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApprovalStage =
  | 'Technical Review'
  | 'Commercial Review'
  | 'Internal Approval'
  | 'Client Approval';

export type ApprovalDecision = 'Approved' | 'Rejected' | 'Changes Requested';

export interface IApproval extends Document {
  _id: Types.ObjectId;
  changeOrder: Types.ObjectId;
  stage: ApprovalStage;
  approver: Types.ObjectId;
  decision: ApprovalDecision;
  comments: string;
  previousStatus: string;
  newStatus: string;
  signedAt: Date;
}

const approvalSchema = new Schema<IApproval>(
  {
    changeOrder: { type: Schema.Types.ObjectId, ref: 'ChangeOrder', required: true, index: true },
    stage: {
      type: String,
      enum: ['Technical Review', 'Commercial Review', 'Internal Approval', 'Client Approval'],
      required: true,
    },
    approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    decision: {
      type: String,
      enum: ['Approved', 'Rejected', 'Changes Requested'],
      required: true,
    },
    comments: { type: String, required: true, trim: true },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    signedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Approval = mongoose.model<IApproval>('Approval', approvalSchema);

