import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
} from '../controllers/invoice.controller.js';
import { requireAuth, requireOrgContext, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', requireRole(['owner', 'admin', 'finance_officer']), createInvoice);
router.post('/:id/payments', requireRole(['owner', 'admin', 'finance_officer']), recordPayment);

export default router;

