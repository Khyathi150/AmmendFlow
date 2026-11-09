import mongoose, { Document, Schema, Types } from 'mongoose';

export type AnnotationType = 'rect' | 'marker' | 'cloud' | 'arrow' | 'text';

export interface IDrawingAnnotation extends Document {
  _id: Types.ObjectId;
  document: Types.ObjectId;
  changeOrder?: Types.ObjectId;
  pageNumber: number;
  type: AnnotationType;
  normalizedX: number;
  normalizedY: number;
  normalizedWidth?: number;
  normalizedHeight?: number;
  color: string;
  label?: string;
  comment?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const drawingAnnotationSchema = new Schema<IDrawingAnnotation>(
  {
    document: { type: Schema.Types.ObjectId, ref: 'Attachment', required: true, index: true },
    changeOrder: { type: Schema.Types.ObjectId, ref: 'ChangeOrder', index: true },
    pageNumber: { type: Number, required: true, default: 1 },
    type: {
      type: String,
      enum: ['rect', 'marker', 'cloud', 'arrow', 'text'],
      default: 'rect',
      required: true,
    },
    normalizedX: { type: Number, required: true, min: 0, max: 1 },
    normalizedY: { type: Number, required: true, min: 0, max: 1 },
    normalizedWidth: { type: Number, min: 0, max: 1 },
    normalizedHeight: { type: Number, min: 0, max: 1 },
    color: { type: String, default: '#C53030' },
    label: { type: String, trim: true },
    comment: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const DrawingAnnotation = mongoose.model<IDrawingAnnotation>(
  'DrawingAnnotation',
  drawingAnnotationSchema
);
