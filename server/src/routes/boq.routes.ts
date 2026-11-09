import { Router } from 'express';
import {
  getProjectBOQ,
  createBOQItem,
  updateBOQItem,
  lockProjectBaseline,
  importBOQCSV,
  exportBOQCSV,
} from '../controllers/boq.controller.js';
import { requireAuth, requireOrgContext, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

// Project scoped BOQ routes
router.get('/projects/:projectId/boq', getProjectBOQ);
router.post('/projects/:projectId/boq', requireRole(['owner', 'admin', 'project_manager', 'commercial_manager']), createBOQItem);
router.post('/projects/:projectId/boq/lock', requireRole(['owner', 'admin', 'commercial_manager']), lockProjectBaseline);
router.post('/projects/:projectId/boq/import', requireRole(['owner', 'admin', 'commercial_manager']), importBOQCSV);
router.get('/projects/:projectId/boq/export', exportBOQCSV);

// Single item update
router.patch('/boq/:id', requireRole(['owner', 'admin', 'commercial_manager']), updateBOQItem);

export default router;
