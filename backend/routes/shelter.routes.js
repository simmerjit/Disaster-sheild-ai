import { Router } from 'express';
import {
  getShelters,
  getRecommendedShelter,
  getShelterStats,
  getNearbyShelters,
  getShelterById,
  createShelter,
  updateShelter,
  deleteShelter,
} from '../controllers/shelter.controller.js';

const router = Router();

// ── GET Endpoints ─────────────────────────────────────────────────────────────

// GET /api/shelters/recommended (MUST be before /:id)
router.get('/recommended', getRecommendedShelter);

// GET /api/shelters/stats (MUST be before /:id)
router.get('/stats', getShelterStats);

// GET /api/shelters/nearby (MUST be before /:id, backward compatibility)
router.get('/nearby', getNearbyShelters);

// GET /api/shelters (Fetch nearby / all shelters)
router.get('/', getShelters);

// GET /api/shelters/:id (Single shelter details)
router.get('/:id', getShelterById);

// ── Mutation Endpoints (Admin / Testing) ───────────────────────────────────────

// POST /api/shelters
router.post('/', createShelter);

// PUT /api/shelters/:id
router.put('/:id', updateShelter);

// DELETE /api/shelters/:id
router.delete('/:id', deleteShelter);

export default router;
