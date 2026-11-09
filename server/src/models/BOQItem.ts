import mongoose, { Document, Schema, Types } from 'mongoose';

export type BOQCategory =
  | 'Civil'
  | 'Structural'
  | 'MEP'
  | 'Finishing'
  | 'Infrastructure'
  | 'External Works'
  | 'General';

export interface IBOQItem extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  project: Types.ObjectId;
  itemCode: string;
  description: string;
  category: BOQCategory;
  unit: string;
  baselineQuantity: number;
  unitRatePaise: number;
  baselineAmountPaise: number;
  isLocked: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const boqItemSchema = new Schema<IBOQItem>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    itemCode: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Civil', 'Structural', 'MEP', 'Finishing', 'Infrastructure', 'External Works', 'General'],
      default: 'General',
      required: true,
      index: true,
    },
    unit: { type: String, required: true, trim: true },
    baselineQuantity: { type: Number, required: true, min: 0 },
    unitRatePaise: { type: Number, required: true, min: 0 },
    baselineAmountPaise: { type: Number, required: true, min: 0 },
    isLocked: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

boqItemSchema.index({ project: 1, itemCode: 1 }, { unique: true });
boqItemSchema.index({ project: 1, category: 1 });

export const BOQItem = mongoose.model<IBOQItem>('BOQItem', boqItemSchema);

