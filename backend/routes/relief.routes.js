import { Router } from 'express';
import { authorize, protect, requireAuth } from '../middleware/auth.middleware.js';
import {
  getAllReliefOrganizations,
  getReliefOrganizationById,
  createReliefOrganization,
  updateReliefOrganization,
  deleteReliefOrganization,
} from '../controllers/relief.controller.js';

const router = Router();

// GET    /api/relief-organizations (supports ?area= & ?service=)
router.get('/', getAllReliefOrganizations);

// GET    /api/relief-organizations/:id
router.get('/:id', getReliefOrganizationById);

// POST   /api/relief-organizations
router.post('/', protect, requireAuth, authorize('admin', 'coordinator'), createReliefOrganization);

// PUT    /api/relief-organizations/:id
router.put('/:id', protect, requireAuth, authorize('admin', 'coordinator'), updateReliefOrganization);

// DELETE /api/relief-organizations/:id
router.delete('/:id', protect, requireAuth, authorize('admin'), deleteReliefOrganization);

export default router;
