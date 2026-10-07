import { Router } from 'express';
import { authorize, protect, requireAuth } from '../middleware/auth.middleware.js';
import {
  getAllRescueOperations,
  getRescueOperationById,
  createRescueOperation,
  updateRescueOperation,
  deleteRescueOperation,
} from '../controllers/rescueOperation.controller.js';

const router = Router();

// GET    /api/rescue-operations
router.get('/', getAllRescueOperations);

// GET    /api/rescue-operations/:id
router.get('/:id', getRescueOperationById);

// POST   /api/rescue-operations
router.post('/', protect, requireAuth, authorize('admin', 'coordinator', 'rescue_worker'), createRescueOperation);

// PUT    /api/rescue-operations/:id
router.put('/:id', protect, requireAuth, authorize('admin', 'coordinator', 'rescue_worker'), updateRescueOperation);

// DELETE /api/rescue-operations/:id
router.delete('/:id', protect, requireAuth, authorize('admin', 'coordinator'), deleteRescueOperation);

export default router;
