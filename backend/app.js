import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { clerkMiddleware } from '@clerk/express';

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
import survivalRoutes from './modules/survival/survival.routes.js';

// Middleware imports
import { errorHandler } from './middleware/error.middleware.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { disasterFeedCache, chatResponseCache } from './utils/cache.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4173,http://127.0.0.1:4173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'This origin is not allowed to access the API.',
    });
  }
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
const hasClerkSecret = Boolean(process.env.CLERK_SECRET_KEY);
const hasClerkPublishableKey = Boolean(process.env.CLERK_PUBLISHABLE_KEY);
if (hasClerkSecret !== hasClerkPublishableKey) {
  throw new Error('Set both CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY, or leave both unset.');
}
if (process.env.NODE_ENV === 'production' && !hasClerkSecret) {
  throw new Error('Clerk keys are required when NODE_ENV=production.');
}
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.CLERK_SECRET_KEY.startsWith('sk_live_') ||
    !process.env.CLERK_PUBLISHABLE_KEY.startsWith('pk_live_'))
) {
  throw new Error('Production requires Clerk live keys (sk_live_ and pk_live_).');
}
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
  throw new Error('CORS_ORIGINS must list the trusted frontend origins in production.');
}
if (hasClerkSecret) {
  app.use(clerkMiddleware());
}
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
app.use('/api/survival', survivalRoutes);

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
      survivalAcademy: '/api/survival',
      rescueOperations: '/api/rescue-operations',
      reliefOrganizations: '/api/relief-organizations',
      chatAssistant: '/api/chat/message',
    },
  });
});

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
