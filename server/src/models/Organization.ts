import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrganization extends Document {
  _id: Types.ObjectId;
  name: string;
  legalEntityName?: string;
  taxId?: string;
  currency: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  logoUrl?: string;
  settings: {
    defaultOverheadPct: number;
    defaultMarkupPct: number;
    defaultTaxPct: number;
    autoLockBaseline: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    legalEntityName: { type: String, trim: true },
    taxId: { type: String, trim: true },
    currency: { type: String, default: 'INR' },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' },
    },
    logoUrl: { type: String },
    settings: {
      defaultOverheadPct: { type: Number, default: 10 },
      defaultMarkupPct: { type: Number, default: 15 },
      defaultTaxPct: { type: Number, default: 18 },
      autoLockBaseline: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
