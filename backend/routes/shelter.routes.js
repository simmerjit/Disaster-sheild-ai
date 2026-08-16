import { Router } from 'express';
import {
  getAllShelters,
  getNearbyShelters,
  getShelterById,
  createShelter,
  updateShelter,
  deleteShelter,
} from '../controllers/shelter.controller.js';

const router = Router();

// GET    /api/shelters/nearby (MUST be before /:id)
router.get('/nearby', getNearbyShelters);

// GET    /api/shelters
router.get('/', getAllShelters);

// GET    /api/shelters/:id
router.get('/:id', getShelterById);

// POST   /api/shelters
router.post('/', createShelter);

// PUT    /api/shelters/:id
router.put('/:id', updateShelter);

// DELETE /api/shelters/:id
router.delete('/:id', deleteShelter);

export default router;
