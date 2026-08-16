import { Router } from 'express';
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
router.post('/', createRescueOperation);

// PUT    /api/rescue-operations/:id
router.put('/:id', updateRescueOperation);

// DELETE /api/rescue-operations/:id
router.delete('/:id', deleteRescueOperation);

export default router;
