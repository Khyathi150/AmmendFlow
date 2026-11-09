import mongoose, { Document, Schema, Types } from 'mongoose';

export type PaymentMethod = 'Bank Transfer' | 'NEFT' | 'RTGS' | 'Cheque' | 'Letter of Credit' | 'Other';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  invoice: Types.ObjectId;
  organization: Types.ObjectId;
  project: Types.ObjectId;
  paymentDate: Date;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    paymentDate: { type: Date, required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'NEFT', 'RTGS', 'Cheque', 'Letter of Credit', 'Other'],
      default: 'RTGS',
      required: true,
    },
    referenceNumber: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

