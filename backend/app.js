import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Route imports
import authRoutes from './routes/auth.routes.js';
import disasterRoutes from './routes/disaster.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import shelterRoutes from './routes/shelter.routes.js';
import placesRoutes from './routes/places.routes.js';
import rescueOperationRoutes from './routes/rescueOperation.routes.js';
import reliefRoutes from './routes/relief.routes.js';
import sosRoutes from './routes/sos.routes.js';
import rescueRoutes from './routes/rescue.routes.js';
import reportRoutes from './routes/report.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Middleware imports
import { errorHandler } from './middleware/error.middleware.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { disasterFeedCache, chatResponseCache } from './utils/cache.js';

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(globalRateLimiter); // Traffic spike & DDoS protection

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/rescue-operations', rescueOperationRoutes);
app.use('/api/relief-organizations', reliefRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/rescue', rescueRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);

// ── Production Health & Telemetry Check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'DisasterShield AI API Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: {
      rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
      heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    },
    caches: {
      disasterFeeds: disasterFeedCache.getMetrics(),
      chatResponses: chatResponseCache.getMetrics(),
    },
  });
});

// ── Root Endpoint ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Disaster Management API is running.',
    healthCheck: '/api/health',
    endpoints: {
      allDisasters: '/api/disasters',
      gdacsLive: '/api/disasters/live',
      usgsEarthquakes: '/api/disasters/earthquakes',
      nasaEonet: '/api/disasters/nasa',
      mosdacWeather: '/api/weather/mosdac',
      mosdacStatus: '/api/weather/mosdac/status',
      nearbyPlaces: '/api/places/nearby',
      shelters: '/api/shelters',
      nearbyShelters: '/api/shelters/nearby',
      rescueOperations: '/api/rescue-operations',
      reliefOrganizations: '/api/relief-organizations',
      chatAssistant: '/api/chat/message',
    },
  });
});

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
