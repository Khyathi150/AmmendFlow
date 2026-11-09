import mongoose, { Document, Schema, Types } from 'mongoose';

export type CostItemCategory = 'Material' | 'Labour' | 'Equipment' | 'Subcontracting' | 'Other';

export interface ICostEstimateItem {
  _id?: Types.ObjectId;
  description: string;
  category: CostItemCategory;
  quantity: number;
  unit: string;
  unitRatePaise: number;
  totalPaise: number;
  boqItemRef?: Types.ObjectId;
}

export interface ICostEstimate extends Document {
  _id: Types.ObjectId;
  changeOrder: Types.ObjectId;
  version: number;
  isFrozen: boolean;
  items: ICostEstimateItem[];
  directCostPaise: number;
  overheadPct: number;
  overheadPaise: number;
  markupPct: number;
  markupPaise: number;
  taxPct: number;
  taxablePaise: number;
  taxPaise: number;
  totalProposedPaise: number;
  preparedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const costEstimateItemSchema = new Schema<ICostEstimateItem>(
  {
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Material', 'Labour', 'Equipment', 'Subcontracting', 'Other'],
      default: 'Material',
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    unitRatePaise: { type: Number, required: true, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
    boqItemRef: { type: Schema.Types.ObjectId, ref: 'BOQItem' },
  },
  { _id: true }
);

const costEstimateSchema = new Schema<ICostEstimate>(
  {
    changeOrder: { type: Schema.Types.ObjectId, ref: 'ChangeOrder', required: true, index: true },
    version: { type: Number, required: true, default: 1 },
    isFrozen: { type: Boolean, default: false },
    items: [costEstimateItemSchema],
    directCostPaise: { type: Number, required: true, default: 0 },
    overheadPct: { type: Number, required: true, default: 10 },
    overheadPaise: { type: Number, required: true, default: 0 },
    markupPct: { type: Number, required: true, default: 15 },
    markupPaise: { type: Number, required: true, default: 0 },
    taxPct: { type: Number, required: true, default: 18 },
    taxablePaise: { type: Number, required: true, default: 0 },
    taxPaise: { type: Number, required: true, default: 0 },
    totalProposedPaise: { type: Number, required: true, default: 0 },
    preparedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

costEstimateSchema.index({ changeOrder: 1, version: 1 }, { unique: true });

export const CostEstimate = mongoose.model<ICostEstimate>('CostEstimate', costEstimateSchema);
