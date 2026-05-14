const connectDB = require('../config/db');

const dbQueryWrapper = async (queryFn, retryCount = 0) => {
  // If Atlas connection was lost and we're still on Atlas, switch to local first
  if (global.atlasConnectionLost && global.dbMode === 'cloud' && retryCount === 0) {
    console.warn('[DB WRAPPER] Atlas marked as unavailable. Switching to local...');
    try {
      await connectDB.switchToLocal();
      global.atlasConnectionLost = false;
      console.log('[DB WRAPPER] Switched to local successfully.');
    } catch (err) {
      console.error('[DB WRAPPER] Failed to switch to local:', err.message);
      global.atlasConnectionLost = false;
    }
  }

  try {
    return await queryFn();
  } catch (error) {
    console.log(`[DB WRAPPER] Query failed: ${error.message}`);

    // Check if it's a database connection error
    const isConnectionError =
      error.message?.includes('getaddrinfo ENOTFOUND') ||
      error.message?.includes('connect ETIMEDOUT') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('Command failed') ||
      error.message?.includes('socket hang up') ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT';

    console.log(`[DB WRAPPER] isConnectionError: ${isConnectionError}, retryCount: ${retryCount}, dbMode: ${global.dbMode}`);

    // If connection error and haven't retried yet and not already in local mode
    if (isConnectionError && retryCount === 0 && global.dbMode !== 'local') {
      console.warn(`[DB WRAPPER] Connection error detected. Switching to local...`);
      global.atlasConnectionLost = true;

      try {
        await connectDB.switchToLocal();
        console.log('[DB WRAPPER] Switched to local. Retrying query...');

        // Retry once with local connection
        return await dbQueryWrapper(queryFn, 1);
      } catch (switchError) {
        console.error('[DB WRAPPER] Failed to switch to local:', switchError.message);
        throw error; // Throw original error
      }
    }

    // Already retried or not a connection error
    console.log('[DB WRAPPER] Throwing error (already retried or not connection error)');
    throw error;
  }
};

module.exports = dbQueryWrapper;
