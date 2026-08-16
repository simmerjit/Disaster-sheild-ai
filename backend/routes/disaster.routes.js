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
import {
  getDisasterImpact,
  createOrUpdateDisasterImpact,
} from '../controllers/impact.controller.js';
import {
  getDisasterUpdates,
  createDisasterUpdate,
  updateDisasterUpdate,
  deleteDisasterUpdate,
} from '../controllers/update.controller.js';
import { getDisasterRescueOperations } from '../controllers/rescueOperation.controller.js';
import { getSachetAlerts } from '../controllers/sachet.controller.js';

const router = Router();

// ── External Disaster API Feeds ─────────────────────────────────────────────
// GET /api/disasters/live        -> GDACS general disaster events
router.get('/live', getLiveDisasters);

// GET /api/disasters/earthquakes -> USGS earthquakes GeoJSON feed
router.get('/earthquakes', getEarthquakes);

// GET /api/disasters/nasa        -> NASA EONET natural events
router.get('/nasa', getNasaEvents);

// GET /api/disasters/sachet      -> NDMA SACHET Indian disaster alerts
router.get('/sachet', getSachetAlerts);

// ── Impact & Casualty Information ───────────────────────────────────────────
// GET /api/disasters/:disasterId/impact
router.get('/:disasterId/impact', getDisasterImpact);

// POST /api/disasters/:disasterId/impact
router.post('/:disasterId/impact', createOrUpdateDisasterImpact);

// PUT /api/disasters/:disasterId/impact
router.put('/:disasterId/impact', createOrUpdateDisasterImpact);

// ── Verified Disaster Updates / News Feed ───────────────────────────────────
// GET /api/disasters/:disasterId/updates
router.get('/:disasterId/updates', getDisasterUpdates);

// POST /api/disasters/:disasterId/updates
router.post('/:disasterId/updates', createDisasterUpdate);

// PUT /api/disasters/:disasterId/updates/:updateId
router.put('/:disasterId/updates/:updateId', updateDisasterUpdate);

// DELETE /api/disasters/:disasterId/updates/:updateId
router.delete('/:disasterId/updates/:updateId', deleteDisasterUpdate);

// ── Disaster Rescue Operations ──────────────────────────────────────────────
// GET /api/disasters/:disasterId/rescue-operations
router.get('/:disasterId/rescue-operations', getDisasterRescueOperations);

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
