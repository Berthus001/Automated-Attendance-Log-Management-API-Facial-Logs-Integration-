const connectDB = require('../config/db');

const asyncErrorHandler = (fn) => async (req, res, next) => {
  console.log(`[ASYNC HANDLER] Request: ${req.method} ${req.path}`);
  console.log(`[ASYNC HANDLER] State - atlasConnectionLost: ${global.atlasConnectionLost}, dbMode: ${global.dbMode}`);

  try {
    // Proactive check: if Atlas was marked as lost and we're still on it, switch now
    if (global.atlasConnectionLost && global.dbMode === 'cloud') {
      console.warn('[ASYNC HANDLER] Atlas marked as unavailable. Proactively switching to local...');
      try {
        await connectDB.switchToLocal();
        global.atlasConnectionLost = false;
        console.log('[ASYNC HANDLER] Switched to local.');
      } catch (err) {
        console.error('[ASYNC HANDLER] Failed to switch to local:', err.message);
        return res.status(503).json({
          success: false,
          message: 'Database unavailable. Check internet or local MongoDB.',
          error: 'DB_CONNECTION_ERROR',
        });
      }
    }

    await fn(req, res, next);
  } catch (error) {
    console.error(`[ASYNC HANDLER] Caught error: ${error.message}`);

    const isMongoError =
      error.message?.includes('getaddrinfo ENOTFOUND') ||
      error.message?.includes('connect ETIMEDOUT') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('Command failed') ||
      error.message?.includes('socket hang up') ||
      error.name === 'MongooseError' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT';

    console.log(`[ASYNC HANDLER] isMongoError: ${isMongoError}, dbMode: ${global.dbMode}`);

    if (isMongoError && global.dbMode !== 'local') {
      console.warn(`[ASYNC HANDLER] ${error.message}. Switching to local...`);
      global.atlasConnectionLost = true;

      try {
        await connectDB.switchToLocal();
        console.log('[ASYNC HANDLER] Switched to local. Please retry.');
        return res.status(503).json({
          success: false,
          message: 'Atlas connection lost. Switched to local. Please retry.',
          error: 'DB_SWITCHED_TO_LOCAL',
          shouldRetry: true,
        });
      } catch (switchErr) {
        console.error('[ASYNC HANDLER] Failed to switch to local:', switchErr.message);
        return res.status(503).json({
          success: false,
          message: 'Database unavailable. Check internet or local MongoDB.',
          error: 'DB_CONNECTION_ERROR',
        });
      }
    }

    // Other errors - pass to regular error handler
    next(error);
  }
};

module.exports = asyncErrorHandler;
