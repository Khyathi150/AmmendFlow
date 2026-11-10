import { Request, Response } from 'express';
import { Types } from 'mongoose';
import path from 'path';
import multer from 'multer';
import { Attachment } from '../models/Attachment.js';
import { DrawingAnnotation } from '../models/DrawingAnnotation.js';
import { Project } from '../models/Project.js';
import { ChangeOrder } from '../models/ChangeOrder.js';
import { env } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/responseEnvelope.js';
import { z } from 'zod';

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      sendError(res, 'NO_FILE', 'No file provided in upload', 400);
      return;
    }

    const { projectId, changeOrderId, category = 'Drawing', notes } = req.body;
    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      sendError(res, 'INVALID_PROJECT', 'A valid project ID is required', 400);
      return;
    }

    const project = await Project.findOne({ _id: projectId, organization: req.orgId });
    if (!project) {
      sendError(res, 'NOT_FOUND', 'Target project not found in current organization', 404);
      return;
    }

    if (changeOrderId && Types.ObjectId.isValid(changeOrderId)) {
      const co = await ChangeOrder.findOne({ _id: changeOrderId, organization: req.orgId });
      if (!co) {
        sendError(res, 'NOT_FOUND', 'Change order not found in current organization', 404);
        return;
      }
    }

    const attachment = new Attachment({
      organization: req.orgId,
      project: new Types.ObjectId(projectId),
      changeOrder: changeOrderId && Types.ObjectId.isValid(changeOrderId)
        ? new Types.ObjectId(changeOrderId)
        : undefined,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: `/uploads/${file.filename}`,
      category,
      uploadedBy: req.user?._id,
      notes,
    });

    await attachment.save();
    sendSuccess(res, { attachment }, 201, 'File uploaded successfully');
  } catch (error: any) {
    console.error('[UploadDocument] Error:', error);
    sendError(res, 'UPLOAD_FAILED', error.message || 'File upload failed', 500);
  }
}

export async function getDocuments(req: Request, res: Response): Promise<void> {
  try {
    const orgId = req.orgId;
    const { projectId, category, changeOrderId } = req.query;

    const query: any = { organization: orgId };
    if (projectId && Types.ObjectId.isValid(projectId as string)) {
      query.project = new Types.ObjectId(projectId as string);
    }
    if (changeOrderId && Types.ObjectId.isValid(changeOrderId as string)) {
      query.changeOrder = new Types.ObjectId(changeOrderId as string);
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const documents = await Attachment.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .populate('changeOrder', 'orderNumber title');

    sendSuccess(res, { documents });
  } catch (error: any) {
    console.error('[GetDocuments] Error:', error);
    sendError(res, 'FETCH_DOCUMENTS_FAILED', error.message || 'Failed to fetch documents', 500);
  }
}

// Annotation Controllers
const createAnnotationSchema = z.object({
  pageNumber: z.number().int().min(1).default(1),
  type: z.enum(['rect', 'marker', 'cloud', 'arrow', 'text']).default('rect'),
  normalizedX: z.number().min(0).max(1),
  normalizedY: z.number().min(0).max(1),
  normalizedWidth: z.number().min(0).max(1).optional(),
  normalizedHeight: z.number().min(0).max(1).optional(),
  color: z.string().default('#C53030'),
  label: z.string().optional(),
  comment: z.string().optional(),
  changeOrderId: z.string().optional(),
});

export async function getAnnotations(req: Request, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    if (!Types.ObjectId.isValid(documentId)) {
      sendError(res, 'INVALID_ID', 'Invalid document identifier', 400);
      return;
    }

    const doc = await Attachment.findOne({ _id: documentId, organization: req.orgId });
    if (!doc) {
      sendError(res, 'NOT_FOUND', 'Document not found in current organization', 404);
      return;
    }

    const annotations = await DrawingAnnotation.find({ document: documentId })
      .sort({ createdAt: 1 })
      .populate('createdBy', 'name email')
      .populate('changeOrder', 'orderNumber title');

    sendSuccess(res, { annotations });
  } catch (error: any) {
    console.error('[GetAnnotations] Error:', error);
    sendError(res, 'FETCH_ANNOTATIONS_FAILED', error.message || 'Failed to fetch annotations', 500);
  }
}

export async function createAnnotation(req: Request, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    if (!Types.ObjectId.isValid(documentId)) {
      sendError(res, 'INVALID_ID', 'Invalid document identifier', 400);
      return;
    }

    const doc = await Attachment.findOne({ _id: documentId, organization: req.orgId });
    if (!doc) {
      sendError(res, 'NOT_FOUND', 'Document not found in current organization', 404);
      return;
    }

    const parseResult = createAnnotationSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.errors);
      return;
    }

    const data = parseResult.data;
    const annotation = new DrawingAnnotation({
      document: new Types.ObjectId(documentId),
      changeOrder: data.changeOrderId && Types.ObjectId.isValid(data.changeOrderId)
        ? new Types.ObjectId(data.changeOrderId)
        : undefined,
      pageNumber: data.pageNumber,
      type: data.type,
      normalizedX: data.normalizedX,
      normalizedY: data.normalizedY,
      normalizedWidth: data.normalizedWidth,
      normalizedHeight: data.normalizedHeight,
      color: data.color,
      label: data.label,
      comment: data.comment,
      createdBy: req.user?._id,
    });

    await annotation.save();
    sendSuccess(res, { annotation }, 201, 'Drawing markup annotation saved');
  } catch (error: any) {
    console.error('[CreateAnnotation] Error:', error);
    sendError(res, 'CREATE_ANNOTATION_FAILED', error.message || 'Failed to save annotation', 500);
  }
}

export async function deleteAnnotation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      sendError(res, 'INVALID_ID', 'Invalid annotation identifier', 400);
      return;
    }

    const annotation = await DrawingAnnotation.findById(id);
    if (!annotation) {
      sendError(res, 'NOT_FOUND', 'Annotation not found', 404);
      return;
    }

    const doc = await Attachment.findOne({ _id: annotation.document, organization: req.orgId });
    if (!doc) {
      sendError(res, 'FORBIDDEN', 'Access denied to this document annotation', 403);
      return;
    }

    await DrawingAnnotation.findByIdAndDelete(id);
    sendSuccess(res, { id }, 200, 'Annotation deleted');
  } catch (error: any) {
    console.error('[DeleteAnnotation] Error:', error);
    sendError(res, 'DELETE_ANNOTATION_FAILED', error.message || 'Failed to delete annotation', 500);
  }
}

