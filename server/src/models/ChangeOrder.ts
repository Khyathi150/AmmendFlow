import mongoose, { Document, Schema, Types } from 'mongoose';

export type ChangeOrderCategory =
  | 'Additional Work'
  | 'Omitted Work'
  | 'Quantity Variation'
  | 'Material Substitution'
  | 'Design Modification'
  | 'Time Extension'
  | 'Other';

export type ChangeOrderPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ChangeOrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Technical Review'
  | 'Commercial Review'
  | 'Internal Approval'
  | 'Client Approval'
  | 'Approved'
  | 'Authorised for Execution'
  | 'In Progress'
  | 'Completed'
  | 'Ready for Invoicing'
  | 'Invoiced'
  | 'Paid'
  | 'Changes Requested'
  | 'Rejected'
  | 'Cancelled';

export interface IChangeOrder extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  project: Types.ObjectId;
  orderNumber: string;
  title: string;
  description: string;
  category: ChangeOrderCategory;
  priority: ChangeOrderPriority;
  requestedBy: Types.ObjectId;
  originatingParty: 'Contractor' | 'Client' | 'Architect' | 'Consultant' | 'Site Condition';
  requestDate: Date;
  reason: string;
  scheduleImpactDays: number;
  totalProposedPaise: number;
  totalApprovedPaise: number;
  invoicedAmountPaise: number;
  status: ChangeOrderStatus;
  unapprovedExecution: boolean;
  unapprovedJustification?: string;
  unapprovedAuthorizedBy?: Types.ObjectId;
  unapprovedAuthorizedAt?: Date;
  activeEstimateId?: Types.ObjectId;
  linkedBoqItemIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const changeOrderSchema = new Schema<IChangeOrder>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    orderNumber: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Additional Work',
        'Omitted Work',
        'Quantity Variation',
        'Material Substitution',
        'Design Modification',
        'Time Extension',
        'Other',
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
      required: true,
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originatingParty: {
      type: String,
      enum: ['Contractor', 'Client', 'Architect', 'Consultant', 'Site Condition'],
      default: 'Contractor',
      required: true,
    },
    requestDate: { type: Date, default: Date.now },
    reason: { type: String, required: true },
    scheduleImpactDays: { type: Number, default: 0 },
    totalProposedPaise: { type: Number, default: 0 },
    totalApprovedPaise: { type: Number, default: 0 },
    invoicedAmountPaise: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Technical Review',
        'Commercial Review',
        'Internal Approval',
        'Client Approval',
        'Approved',
        'Authorised for Execution',
        'In Progress',
        'Completed',
        'Ready for Invoicing',
        'Invoiced',
        'Paid',
        'Changes Requested',
        'Rejected',
        'Cancelled',
      ],
      default: 'Draft',
      required: true,
      index: true,
    },
    unapprovedExecution: { type: Boolean, default: false, index: true },
    unapprovedJustification: { type: String },
    unapprovedAuthorizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    unapprovedAuthorizedAt: { type: Date },
    activeEstimateId: { type: Schema.Types.ObjectId, ref: 'CostEstimate' },
    linkedBoqItemIds: [{ type: Schema.Types.ObjectId, ref: 'BOQItem' }],
  },
  { timestamps: true }
);

changeOrderSchema.index({ project: 1, orderNumber: 1 }, { unique: true });
changeOrderSchema.index({ organization: 1, status: 1 });
changeOrderSchema.index({ project: 1, status: 1 });
changeOrderSchema.index({ organization: 1, unapprovedExecution: 1 });

export const ChangeOrder = mongoose.model<IChangeOrder>('ChangeOrder', changeOrderSchema);

