const crypto = require('crypto');

// Simple in-memory store for request tracking (in production, use Redis)
const requestStore = new Map();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

// Helper function to get client identifier
function getClientId(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

// Helper function to log authentication attempts
function logAuthAttempt(clientId, success, reason = '') {
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCCESS' : 'FAILED';
  const message = `[${timestamp}] AUTH ${status} - Client: ${clientId}`;

  if (reason) {
    console.log(`${message} - Reason: ${reason}`);
  } else {
    console.log(message);
  }
}

// Rate limiting function
function checkRateLimit(clientId) {
  const now = Date.now();
  const clientData = requestStore.get(clientId) || {
    requests: [],
    lastReset: now,
  };

  // Clean old requests outside the window
  clientData.requests = clientData.requests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check if limit exceeded
  if (clientData.requests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.min(...clientData.requests) + RATE_LIMIT_WINDOW,
    };
  }

  // Add current request
  clientData.requests.push(now);
  requestStore.set(clientId, clientData);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - clientData.requests.length,
    resetTime: now + RATE_LIMIT_WINDOW,
  };
}

// Enhanced authentication middleware
module.exports = function (req, res, next) {
  const startTime = Date.now();
  const clientId = getClientId(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const method = req.method;
  const path = req.path;

  try {
    // Check rate limiting first
    const rateLimitResult = checkRateLimit(clientId);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS,
      'X-RateLimit-Remaining': rateLimitResult.remaining,
      'X-RateLimit-Reset': rateLimitResult.resetTime,
    });

    if (!rateLimitResult.allowed) {
      logAuthAttempt(clientId, false, 'Rate limit exceeded');
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      });
    }

    // Check for API key
    const token = req.headers['x-api-key'];

    if (!token) {
      logAuthAttempt(clientId, false, 'Missing API key');
      return res.status(401).json({
        success: false,
        error: 'Authentication Required',
        message: "API key is required. Please provide 'x-api-key' header.",
      });
    }

    // Validate API key
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      console.error('⚠️  WARNING: API_KEY environment variable not set!');
      logAuthAttempt(clientId, false, 'Server configuration error');
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Authentication service is not properly configured.',
      });
    }

    // Use crypto.timingSafeEqual to prevent timing attacks
    const providedKey = Buffer.from(token, 'utf8');
    const expectedKey = Buffer.from(validApiKey, 'utf8');

    if (
      providedKey.length !== expectedKey.length ||
      !crypto.timingSafeEqual(providedKey, expectedKey)
    ) {
      logAuthAttempt(clientId, false, 'Invalid API key');
      return res.status(403).json({
        success: false,
        error: 'Invalid API Key',
        message: 'The provided API key is invalid.',
      });
    }

    // Authentication successful
    logAuthAttempt(clientId, true);

    // Add request metadata for potential logging/monitoring
    req.auth = {
      clientId,
      userAgent,
      authenticatedAt: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };

    // Add request timing
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(
        `[${req.auth.authenticatedAt}] ${method} ${path} - ${res.statusCode} - ${duration}ms - Client: ${clientId}`
      );
    });

    next();
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    logAuthAttempt(clientId, false, 'Internal error');

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An error occurred during authentication.',
    });
  }
};
