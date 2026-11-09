import { Router } from 'express';
import {
  recordApprovalDecision,
  getApprovalsForOrder,
} from '../controllers/approval.controller.js';
import { requireAuth, requireOrgContext } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

router.get('/:id/approvals', getApprovalsForOrder);
router.post('/:id/approvals', recordApprovalDecision);

export default router;
