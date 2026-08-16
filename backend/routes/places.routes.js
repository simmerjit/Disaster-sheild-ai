import { Router } from 'express';
import { getNearbyPlaces } from '../controllers/places.controller.js';

const router = Router();

// ── Google Places Emergency Facilities ───────────────────────────────────────
// GET /api/places/nearby?latitude=...&longitude=...&radius=5000&type=hospital
router.get('/nearby', getNearbyPlaces);

export default router;
