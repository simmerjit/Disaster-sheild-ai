import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Route imports
import authRoutes from './routes/auth.routes.js';
import disasterRoutes from './routes/disaster.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import shelterRoutes from './routes/shelter.routes.js';
import sosRoutes from './routes/sos.routes.js';
import rescueRoutes from './routes/rescue.routes.js';
import reportRoutes from './routes/report.routes.js';

// Middleware imports
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/rescue', rescueRoutes);
app.use('/api/reports', reportRoutes);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Disaster Management API is running.',
    endpoints: {
      allDisasters: '/api/disasters',
      gdacsLive: '/api/disasters/live',
      usgsEarthquakes: '/api/disasters/earthquakes',
      nasaEonet: '/api/disasters/nasa',
      mosdacWeather: '/api/weather/mosdac',
      mosdacStatus: '/api/weather/mosdac/status',
    },
  });
});

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
