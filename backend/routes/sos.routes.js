// sos.routes.js
// TODO: Wire up SOS controller handlers to their routes.

import { Router } from 'express';
import {
  getAllSOS,
  getSOSById,
  createSOS,
  updateSOS,
  deleteSOS,
} from '../controllers/sos.controller.js';

const router = Router();

// GET    /api/sos
router.get('/', getAllSOS);

// GET    /api/sos/:id
router.get('/:id', getSOSById);

// POST   /api/sos
router.post('/', createSOS);

// PUT    /api/sos/:id
router.put('/:id', updateSOS);

// DELETE /api/sos/:id
router.delete('/:id', deleteSOS);

export default router;
