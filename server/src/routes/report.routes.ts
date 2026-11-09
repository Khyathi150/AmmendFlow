import { Router } from 'express';
import { getVariationRegister } from '../controllers/report.controller.js';
import { requireAuth, requireOrgContext } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

router.get('/variation-register', getVariationRegister);

export default router;
