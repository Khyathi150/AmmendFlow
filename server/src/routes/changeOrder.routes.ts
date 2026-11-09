import { Router } from 'express';
import {
  getChangeOrders,
  getChangeOrderById,
  createChangeOrder,
  submitChangeOrder,
  authorizeExecution,
  startWork,
  completeWork,
} from '../controllers/changeOrder.controller.js';
import {
  saveEstimate,
  getEstimates,
} from '../controllers/costEstimate.controller.js';
import { requireAuth, requireOrgContext, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

router.get('/', getChangeOrders);
router.get('/:id', getChangeOrderById);
router.post('/', createChangeOrder);
router.post('/:id/submit', submitChangeOrder);
router.post('/:id/authorize-execution', requireRole(['owner', 'admin', 'project_manager']), authorizeExecution);
router.post('/:id/start-work', requireRole(['owner', 'admin', 'project_manager', 'site_engineer']), startWork);
router.post('/:id/complete-work', requireRole(['owner', 'admin', 'project_manager', 'site_engineer']), completeWork);

// Estimates
router.get('/:changeOrderId/estimates', getEstimates);
router.post('/:changeOrderId/estimates', requireRole(['owner', 'admin', 'project_manager', 'commercial_manager']), saveEstimate);

export default router;
