import { Router } from 'express';
import { getFinancialExposure } from '../controllers/financialExposure.controller.js';
import { requireAuth, requireOrgContext } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

router.get('/', getFinancialExposure);

export default router;
