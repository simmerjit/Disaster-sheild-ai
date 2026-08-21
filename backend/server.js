import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// Start the HTTP server immediately so API routes and feeds are instantly available
const server = app.listen(PORT, () => {
  console.log(`🚀 [DisasterShield Backend] Server running at http://localhost:${PORT}`);
  console.log(`📡 [Endpoints] Live telemetry, GDACS, USGS, NASA, Weather, and Auth ready.`);
});

// Initialize database connection in background
connectDB().catch((err) => {
  console.warn(`[MongoDB] Initial connection attempt: ${err.message}`);
});

export default server;
