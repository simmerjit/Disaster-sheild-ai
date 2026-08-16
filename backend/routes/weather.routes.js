import { Router } from 'express';
import {
  getMosdacWeather,
  getMosdacStatus,
} from '../controllers/weather.controller.js';

const router = Router();

// ── MOSDAC (ISRO) Weather Data ───────────────────────────────────────────────
// GET /api/weather/mosdac         -> Fetch weather data from MOSDAC
router.get('/mosdac', getMosdacWeather);

// GET /api/weather/mosdac/status  -> Check MOSDAC integration status
router.get('/mosdac/status', getMosdacStatus);

export default router;
