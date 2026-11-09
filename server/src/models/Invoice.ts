import mongoose, { Document, Schema, Types } from 'mongoose';

export type InvoiceStatus = 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  project: Types.ObjectId;
  changeOrders: Types.ObjectId[];
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  subtotalPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  amountPaidPaise: number;
  balanceDuePaise: number;
  status: InvoiceStatus;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    changeOrders: [{ type: Schema.Types.ObjectId, ref: 'ChangeOrder', required: true }],
    invoiceNumber: { type: String, required: true, uppercase: true, trim: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    subtotalPaise: { type: Number, required: true, min: 0 },
    taxPaise: { type: Number, required: true, min: 0 },
    totalAmountPaise: { type: Number, required: true, min: 0 },
    amountPaidPaise: { type: Number, default: 0, min: 0 },
    balanceDuePaise: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Issued',
      required: true,
      index: true,
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ project: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organization: 1, status: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
