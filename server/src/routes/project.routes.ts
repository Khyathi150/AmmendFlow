import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
} from '../controllers/project.controller.js';
import { requireAuth, requireOrgContext, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireOrgContext);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', requireRole(['owner', 'admin', 'project_manager']), createProject);
router.patch('/:id', requireRole(['owner', 'admin', 'project_manager']), updateProject);

export default router;
