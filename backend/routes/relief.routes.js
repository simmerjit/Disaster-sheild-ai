import { Router } from 'express';
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
router.post('/', createReliefOrganization);

// PUT    /api/relief-organizations/:id
router.put('/:id', updateReliefOrganization);

// DELETE /api/relief-organizations/:id
router.delete('/:id', deleteReliefOrganization);

export default router;
