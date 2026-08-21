import mongoose from 'mongoose';

// Disable Mongoose command buffering so queries fail immediately with fast fallbacks instead of hanging 10s
mongoose.set('bufferCommands', false);

let isConnected = false;
let retryTimer = null;
let seedInitialized = false;

/**
 * Resolves MongoDB Atlas SRV URI into standard replica set hosts using DoH if system DNS fails.
 */
async function resolveAtlasUri(uri) {
  if (!uri || !uri.startsWith('mongodb+srv://')) return uri;

  try {
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/?[^?]*)(\?.*)?$/);
    if (!match) return uri;

    const [, user, pass, hostname, dbName] = match;
    const srvQueryHost = `_mongodb._tcp.${hostname}`;

    // Query DoH (Google DNS over HTTPS) for both SRV and TXT in parallel
    const [srvRes, txtRes] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${srvQueryHost}&type=SRV`, {
        headers: { Accept: 'application/dns-json' },
      }).then((r) => r.json()).catch(() => ({})),
      fetch(`https://dns.google/resolve?name=${hostname}&type=TXT`, {
        headers: { Accept: 'application/dns-json' },
      }).then((r) => r.json()).catch(() => ({})),
    ]);

    if (srvRes.Answer && srvRes.Answer.length > 0) {
      const hosts = srvRes.Answer.map((ans) => {
        const parts = ans.data.trim().split(' ');
        const port = parts[2] || '27017';
        const host = parts[3]?.replace(/\.$/, '') || hostname;
        return `${host}:${port}`;
      }).join(',');

      let txtParams = 'ssl=true&authSource=admin&retryWrites=true&w=majority';
      if (txtRes.Answer && txtRes.Answer.length > 0) {
        const rawTxt = txtRes.Answer.map((a) => a.data.replace(/"/g, '')).join('&');
        if (rawTxt) {
          txtParams = `${rawTxt}&ssl=true&retryWrites=true&w=majority`;
        }
      }

      const cleanDb = dbName && dbName !== '/' ? dbName.replace(/^\//, '') : 'disaster_shield';
      const fallbackUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hosts}/${cleanDb}?${txtParams}`;
      return fallbackUri;
    }
  } catch (err) {
    console.warn(`[MongoDB] DoH resolution fallback note: ${err.message}`);
  }

  return uri;
}

const triggerInitialSeeding = async () => {
  if (seedInitialized || mongoose.connection.readyState !== 1) return;
  seedInitialized = true;
  try {
    const { seedDefaultTeamsIfEmpty } = await import('../controllers/rescue.controller.js');
    const { seedDefaultSOSIfEmpty } = await import('../controllers/sos.controller.js');
    const survivalService = (await import('../modules/survival/survival.service.js')).default;

    await Promise.allSettled([
      seedDefaultTeamsIfEmpty(),
      seedDefaultSOSIfEmpty(),
      survivalService.ensureSeededData(),
    ]);
  } catch (err) {
    // Silent catch for seeding notes
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  triggerInitialSeeding();
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const rawUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disaster_shield';

  try {
    let targetUri = rawUri;
    try {
      await mongoose.connect(targetUri, {
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log(`✅ [MongoDB] Connected successfully: ${mongoose.connection.host}`);
      triggerInitialSeeding();
      return;
    } catch (stdErr) {
      if (
        stdErr.message?.includes('querySrv') ||
        stdErr.message?.includes('ECONNREFUSED') ||
        stdErr.message?.includes('ENOTFOUND') ||
        stdErr.message?.includes('ETIMEDOUT')
      ) {
        console.warn(`⚠️ [MongoDB] SRV lookup failed on local DNS. Resolving via DoH fallback...`);
        const resolvedUri = await resolveAtlasUri(rawUri);
        if (resolvedUri !== rawUri) {
          await mongoose.connect(resolvedUri, {
            serverSelectionTimeoutMS: 4000,
            socketTimeoutMS: 45000,
          });
          isConnected = true;
          console.log(`✅ [MongoDB] Connected via DoH fallback: ${mongoose.connection.host}`);
          triggerInitialSeeding();
          return;
        }
      }
      throw stdErr;
    }
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ [MongoDB] Connection note: ${error.message}`);
    console.warn(`💡 [DisasterShield] Running in resilient fallback mode (API and live feeds operational).`);
    console.warn(`💡 If using MongoDB Atlas, verify that Network Access allows 0.0.0.0/0 or your current IP.`);

    // Schedule background retry after 30 seconds without blocking the server
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB().catch(() => {});
      }, 30000);
    }
  }
};

export default connectDB;
