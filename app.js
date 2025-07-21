const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const employeeRoutes = require('./routes/employee');
const departmentRoutes = require('./routes/department');

const app = express();

// Enhanced middleware stack
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // More detailed logging

// Security headers middleware
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  next();
});

// Request ID middleware for better tracing
app.use((req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  res.set('X-Request-ID', req.requestId);
  next();
});

// API Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Enterprise API',
    version: '3.0.0',
    description:
      'A comprehensive enterprise management API with advanced staff and organizational unit management capabilities',
    author: 'Enterprise Development Team',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Check API health status',
      },
      staff: {
        base: '/api/employees',
        endpoints: {
          directory: {
            method: 'GET',
            path: '/staff-directory',
            description:
              'Get all staff members with advanced filtering, sorting, and organizational insights',
            queryParams:
              'search, department, status, startDate, endDate, minSalary, maxSalary, employmentType, workLocation, skillLevel, includeInactive, sortBy, sortOrder, page, limit',
          },
          profile: {
            method: 'GET',
            path: '/profile/:id',
            description:
              'Get individual staff member profile with detailed information',
            queryParams: 'includeDetails, publicView',
          },
          onboard: {
            method: 'POST',
            path: '/onboard',
            description:
              'Onboard new team member with comprehensive validation',
            queryParams: 'bulkOnboarding, skipNotifications, autoActivate',
          },
          modify: {
            method: 'PUT',
            path: '/modify/:id',
            description: 'Modify team member details with tracking',
            queryParams: 'skipValidation, source',
          },
          deactivate: {
            method: 'DELETE',
            path: '/deactivate/:id',
            description:
              'Deactivate team member account with retention options',
            queryParams: 'type, retainData, notifyManager',
          },
          intelligence: {
            method: 'GET',
            path: '/intelligence/dashboard',
            description:
              'Get workforce intelligence dashboard with predictive analytics',
            queryParams:
              'includeProjections, timeframe, granularity, historical',
          },
        },
      },
      organization: {
        base: '/api/departments',
        endpoints: {
          units: {
            method: 'GET',
            path: '/org-units',
            description:
              'Get organizational units directory with advanced hierarchy and reporting features',
            queryParams:
              'location, minBudget, maxBudget, startDate, endDate, minEmployees, maxEmployees, level, hierarchy, activeOnly, reporting, sortBy, sortOrder',
          },
          details: {
            method: 'GET',
            path: '/unit-details/:id',
            description:
              'Get organizational unit details with comprehensive metrics',
            queryParams: 'includeTeam, includeMetrics, detail',
          },
          establish: {
            method: 'POST',
            path: '/establish',
            description:
              'Establish new organizational unit with setup automation',
            queryParams: 'mode, autoCode, notify',
          },
          restructure: {
            method: 'PUT',
            path: '/restructure/:id',
            description: 'Restructure organizational unit with change tracking',
            queryParams: 'type, preserveHistory, effectiveDate',
          },
          dissolve: {
            method: 'DELETE',
            path: '/dissolve/:id',
            description:
              'Dissolve organizational unit with transition management',
            queryParams: 'reason, transferEmployees, archive, effectiveDate',
          },
          financialIntelligence: {
            method: 'GET',
            path: '/financial-intelligence/comprehensive',
            description:
              'Get organizational financial intelligence with predictive analytics',
            queryParams: 'forecast, depth, baseline, variance',
          },
          effectiveness: {
            method: 'GET',
            path: '/effectiveness/analytics',
            description:
              'Get organizational effectiveness analytics with benchmarking',
            queryParams:
              'startDate, endDate, budgetTier, teamCategory, benchmark, productivity, weighting, window',
          },
        },
      },
    },
    authentication: {
      type: 'API Key',
      header: 'x-api-key',
      description: 'Include your API key in the x-api-key header',
    },
    rateLimit: {
      window: '15 minutes',
      maxRequests: 100,
      headers: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
    },
  });
});

// Enhanced health check with system information
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'UP',
    service: 'Enterprise API',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      human: `${Math.floor(uptime / 3600)}h ${Math.floor(
        (uptime % 3600) / 60
      )}m ${Math.floor(uptime % 60)}s`,
    },
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    requestId: req.requestId,
  });
});

// API routes
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/employees/staff-directory',
      'GET /api/employees/profile/:id',
      'POST /api/employees/onboard',
      'PUT /api/employees/modify/:id',
      'DELETE /api/employees/deactivate/:id',
      'GET /api/employees/intelligence/dashboard',
      'GET /api/departments/org-units',
      'GET /api/departments/unit-details/:id',
      'POST /api/departments/establish',
      'PUT /api/departments/restructure/:id',
      'DELETE /api/departments/dissolve/:id',
      'GET /api/departments/financial-intelligence/comprehensive',
      'GET /api/departments/effectiveness/analytics',
    ],
    requestId: req.requestId,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(`❌ [${new Date().toISOString()}] Error occurred:`, {
    message: error.message,
    stack: error.stack,
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Enterprise API Server started successfully!`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
  console.log(`🔑 Remember to set your API_KEY environment variable`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `❌ Port ${PORT} is already in use. Please try a different port.`
    );
  } else {
    console.error('❌ Server startup error:', error);
  }
  process.exit(1);
});

module.exports = app;
