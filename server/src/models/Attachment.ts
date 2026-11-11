import mongoose, { Document, Schema, Types } from 'mongoose';

export type DocumentCategory =
  | 'Contract'
  | 'BOQ'
  | 'Drawing'
  | 'Site Photo'
  | 'Variation Evidence'
  | 'Invoice'
  | 'Payment Receipt'
  | 'General';

export type AttachmentStorageProvider = 'local' | 's3';

export interface IAttachment extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  project: Types.ObjectId;
  changeOrder?: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  storageProvider: AttachmentStorageProvider;
  storageKey?: string;
  category: DocumentCategory;
  version: number;
  uploadedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    changeOrder: { type: Schema.Types.ObjectId, ref: 'ChangeOrder', index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
    storageProvider: {
      type: String,
      enum: ['local', 's3'],
      default: 'local',
      required: true,
    },
    storageKey: { type: String },
    category: {
      type: String,
      enum: [
        'Contract',
        'BOQ',
        'Drawing',
        'Site Photo',
        'Variation Evidence',
        'Invoice',
        'Payment Receipt',
        'General',
      ],
      default: 'General',
      required: true,
      index: true,
    },
    version: { type: Number, default: 1 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Attachment = mongoose.model<IAttachment>('Attachment', attachmentSchema);
