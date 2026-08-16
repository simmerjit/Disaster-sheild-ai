import { Router } from 'express';
import { getSachetAlerts } from '../controllers/sachet.controller.js';

const router = Router();

// GET /api/disasters/sachet -> NDMA SACHET Disaster Alerts
router.get('/', getSachetAlerts);

export default router;
