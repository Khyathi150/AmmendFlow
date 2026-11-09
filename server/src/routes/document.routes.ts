import { Router } from 'express';
import {
  upload,
  uploadDocument,
  getDocuments,
  getAnnotations,
  createAnnotation,
  deleteAnnotation,
} from '../controllers/document.controller.js';
import { requireAuth, requireOrgContext } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);

// Drawing Markup Annotations
router.get('/:documentId/annotations', getAnnotations);
router.post('/:documentId/annotations', createAnnotation);
router.delete('/annotations/:id', deleteAnnotation);

export default router;
