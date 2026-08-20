import mongoose from 'mongoose';

let isConnected = false;
let retryTimer = null;

/**
 * Resolves MongoDB Atlas SRV URI into standard replica set hosts using DoH if system DNS fails.
 */
async function resolveAtlasUri(uri) {
  if (!uri || !uri.startsWith('mongodb+srv://')) return uri;

  try {
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/?[^?]*)(\?.*)?$/);
    if (!match) return uri;

    const [, user, pass, hostname, dbName, queryParams] = match;
    const srvQueryHost = `_mongodb._tcp.${hostname}`;

    // Query DoH (Google DNS over HTTPS)
    const dohRes = await fetch(`https://dns.google/resolve?name=${srvQueryHost}&type=SRV`, {
      headers: { Accept: 'application/dns-json' },
    });
    const data = await dohRes.json();

    if (data.Answer && data.Answer.length > 0) {
      const hosts = data.Answer.map((ans) => {
        // ans.data format: "0 0 27017 host.mongodb.net."
        const parts = ans.data.trim().split(' ');
        const port = parts[2] || '27017';
        const host = parts[3]?.replace(/\.$/, '') || hostname;
        return `${host}:${port}`;
      }).join(',');

      const cleanDb = dbName && dbName !== '/' ? dbName.replace(/^\//, '') : 'disaster_shield';
      const fallbackUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hosts}/${cleanDb}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
      return fallbackUri;
    }
  } catch (err) {
    console.warn(`[MongoDB] DoH resolution fallback skipped: ${err.message}`);
  }

  return uri;
}

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const rawUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disaster_shield';

  try {
    // Attempt standard connection first
    let targetUri = rawUri;
    try {
      await mongoose.connect(targetUri, {
        serverSelectionTimeoutMS: 4000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log(`✅ [MongoDB] Connected successfully: ${mongoose.connection.host}`);
      return;
    } catch (stdErr) {
      // If SRV lookup failed, attempt DoH fallback resolution
      if (stdErr.message?.includes('querySrv') || stdErr.message?.includes('ECONNREFUSED')) {
        console.warn(`⚠️ [MongoDB] SRV lookup failed on local DNS. Resolving via DoH fallback...`);
        const resolvedUri = await resolveAtlasUri(rawUri);
        if (resolvedUri !== rawUri) {
          await mongoose.connect(resolvedUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          });
          isConnected = true;
          console.log(`✅ [MongoDB] Connected via DoH fallback: ${mongoose.connection.host}`);
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

    // Schedule background retry after 15 seconds without blocking the server
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB().catch(() => {});
      }, 15000);
    }
  }
};

export default connectDB;
