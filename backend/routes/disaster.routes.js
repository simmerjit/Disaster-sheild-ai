import { Router } from 'express';
import {
  getAllDisasters,
  getLiveDisasters,
  getEarthquakes,
  getNasaEvents,
  getDisasterById,
  createDisaster,
  updateDisaster,
  deleteDisaster,
} from '../controllers/disaster.controller.js';

const router = Router();

// ── External Disaster API Feeds (Normalized for Leaflet Frontend) ─────────────
// GET /api/disasters/live        -> GDACS general disaster events
router.get('/live', getLiveDisasters);

// GET /api/disasters/earthquakes -> USGS earthquakes GeoJSON feed
router.get('/earthquakes', getEarthquakes);

// GET /api/disasters/nasa        -> NASA EONET natural events
router.get('/nasa', getNasaEvents);

// ── Core Disaster CRUD / Aggregate Endpoints ─────────────────────────────────
// GET /api/disasters            -> Aggregated live + stored disasters
router.get('/', getAllDisasters);

// GET /api/disasters/:id        -> Single disaster details
router.get('/:id', getDisasterById);

// POST /api/disasters           -> Create custom disaster in DB
router.post('/', createDisaster);

// PUT /api/disasters/:id        -> Update disaster in DB
router.put('/:id', updateDisaster);

// DELETE /api/disasters/:id     -> Delete disaster in DB
router.delete('/:id', deleteDisaster);

export default router;
