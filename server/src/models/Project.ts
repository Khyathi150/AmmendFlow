import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export interface IProject extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  clientName: string;
  clientContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  contractorName: string;
  location: {
    address?: string;
    city: string;
    state: string;
    country?: string;
  };
  startDate: Date;
  targetEndDate: Date;
  actualEndDate?: Date;
  originalContractPaise: number;
  currency: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    clientName: { type: String, required: true, trim: true },
    clientContact: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    contractorName: { type: String, required: true, trim: true },
    location: {
      address: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      country: { type: String, default: 'India' },
    },
    startDate: { type: Date, required: true },
    targetEndDate: { type: Date, required: true },
    actualEndDate: { type: Date },
    originalContractPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Active',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ organization: 1, code: 1 }, { unique: true });
projectSchema.index({ organization: 1, status: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);

