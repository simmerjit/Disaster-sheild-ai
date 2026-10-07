import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5001;

let server;
const startServer = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    await connectDB();
  }

  server = app.listen(PORT, () => {
    console.log(`🚀 [DisasterShield Backend] Server running at http://localhost:${PORT}`);
    console.log(`📡 [Endpoints] Live telemetry, GDACS, USGS, NASA, Weather, and Auth ready.`);
  });

  if (!isProduction) {
    connectDB().catch((error) => {
      console.warn(`[MongoDB] Initial connection attempt: ${error.message}`);
    });
  }
};

startServer().catch((error) => {
  console.error(`[Startup] Required production services are unavailable: ${error.message}`);
  process.exitCode = 1;
});

export default server;
