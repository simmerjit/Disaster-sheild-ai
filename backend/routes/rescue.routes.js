// rescue.routes.js
// TODO: Wire up rescue controller handlers to their routes.

import { Router } from 'express';
import {
  getAllRescues,
  getRescueById,
  createRescue,
  updateRescue,
  deleteRescue,
} from '../controllers/rescue.controller.js';

const router = Router();

// GET    /api/rescue
router.get('/', getAllRescues);

// GET    /api/rescue/:id
router.get('/:id', getRescueById);

// POST   /api/rescue
router.post('/', createRescue);

// PUT    /api/rescue/:id
router.put('/:id', updateRescue);

// DELETE /api/rescue/:id
router.delete('/:id', deleteRescue);

export default router;
