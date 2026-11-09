import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  switchOrganization,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/switch-org', requireAuth, switchOrganization);

export default router;

