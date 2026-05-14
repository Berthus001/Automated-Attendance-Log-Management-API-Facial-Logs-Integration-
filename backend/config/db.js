const mongoose = require('mongoose');

const getAtlasUri = () => process.env.MONGO_URI;
const getOfflineUri = () => process.env.MONGO_URI_OFFLINE || process.env.MONGO_URI_LOCAL;
const isForceOffline = () => String(process.env.FORCE_OFFLINE || 'false').toLowerCase() === 'true';

const getConnectionOptions = () => {
  const timeoutMs = parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10);

  return {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 3000,
    socketTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  };
};

const setDbMode = (mode) => {
  global.dbMode = mode;
  global.isOfflineMode = mode === 'local';
};

const connectToDatabase = async (uri, mode) => {
  if (!uri) {
    throw new Error(`MongoDB ${mode} URI is not configured`);
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri, getConnectionOptions());
  setDbMode(mode);
  global.currentMongoUri = uri;
  console.log(`Connected to ${mode === 'cloud' ? 'MongoDB Atlas' : 'Local MongoDB'}`);

  // Add connection event listeners
  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] Connection disconnected');
    if (mode === 'cloud') {
      console.warn('[DB] Atlas connection lost. Will attempt fallback to local on next query.');
      global.atlasConnectionLost = true;
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] Connection error:', err.message);
    if (mode === 'cloud' && !global.atlasConnectionLost) {
      global.atlasConnectionLost = true;
      console.warn('[DB] Marked Atlas as unavailable due to error');
    }
  });
};

const isAtlasAvailable = async () => {
  const atlasUri = getAtlasUri();

  if (isForceOffline() || !atlasUri) {
    return false;
  }

  const connection = mongoose.createConnection(atlasUri, getConnectionOptions());

  try {
    await connection.asPromise();
    await connection.db.admin().ping();
    return true;
  } catch (error) {
    console.warn('Atlas health check failed:', error.message);
    return false;
  } finally {
    await connection.close().catch(() => {});
  }
};

const switchToLocal = async () => {
  const offlineUri = getOfflineUri();

  if (!offlineUri) {
    throw new Error('Local MongoDB URI is not configured. Set MONGO_URI_OFFLINE in your .env file.');
  }

  if (global.dbMode === 'local' && mongoose.connection.readyState === 1) {
    return false;
  }

  console.warn('Switching active database connection to local MongoDB...');
  await connectToDatabase(offlineUri, 'local');
  return true;
};

const switchToAtlas = async () => {
  const atlasUri = getAtlasUri();

  if (!atlasUri) {
    throw new Error('MONGO_URI is not configured');
  }

  if (isForceOffline()) {
    return false;
  }

  if (global.dbMode === 'cloud' && mongoose.connection.readyState === 1) {
    return false;
  }

  console.log('Switching active database connection to MongoDB Atlas...');
  await connectToDatabase(atlasUri, 'cloud');
  return true;
};

const connectDB = async () => {
  const atlasUri = getAtlasUri();

  if (isForceOffline()) {
    console.log('FORCE_OFFLINE is enabled. Connecting to local MongoDB only.');
    await switchToLocal();
    return;
  }

  if (atlasUri) {
    try {
      await connectToDatabase(atlasUri, 'cloud');
      return;
    } catch (err) {
      console.warn('Atlas unavailable. Switching to local MongoDB...', err.message);
    }
  }

  await switchToLocal();
};

connectDB.isAtlasAvailable = isAtlasAvailable;
connectDB.switchToLocal = switchToLocal;
connectDB.switchToAtlas = switchToAtlas;
connectDB.getAtlasUri = getAtlasUri;
connectDB.getOfflineUri = getOfflineUri;
connectDB.isForceOffline = isForceOffline;

module.exports = connectDB;
