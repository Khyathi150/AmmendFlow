import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  organization: Types.ObjectId;
  project?: Types.ObjectId;
  title: string;
  message: string;
  type: 'approval_requested' | 'status_updated' | 'clarification_needed' | 'work_authorized' | 'invoice_issued' | 'payment_received';
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'approval_requested',
        'status_updated',
        'clarification_needed',
        'work_authorized',
        'invoice_issued',
        'payment_received',
      ],
      required: true,
    },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

