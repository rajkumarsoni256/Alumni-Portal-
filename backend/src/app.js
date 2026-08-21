const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const migrate = require('./db/migrate');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const postRoutes = require('./routes/postRoutes');
const jobRoutes = require('./routes/jobRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const hashtagRoutes = require('./routes/hashtagRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet({
  contentSecurityPolicy: false, // Disable default CSP header to prevent frontend asset blocking in dev/prod
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow frontend cross-origin image/upload loading
}));

app.use(cookieParser());

// Cache-Control security headers for authenticated API routes
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Centralized CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
      const isAllowed = allowedOrigins.some((o) => o.trim().replace(/\/+$/, '').toLowerCase() === normOrigin);

      // Allow registered origins, wildcard, or any Vercel deployment domain
      if (isAllowed || allowedOrigins.includes('*') || normOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // In development mode, allow any localhost/127.0.0.1 origin
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400,
  })
);
app.options('*', cors());

// Normalize double slashes in request URLs (e.g. //api/v1 -> /api/v1)
app.use((req, res, next) => {
  if (req.url && req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  next();
});

// Body parsers with 50MB payload limit for profile photos and banner uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Centralized Request-Scoped Logger Middleware
app.use(requestLogger);

// Serve static upload directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'JU Connect / JECRC Community API Backend Service',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      admin: '/api/v1/admin'
    }
  });
});

// Health Check Endpoints
app.get(['/health', '/api/v1/health', '/actuator/health', '/healthz', '/heath'], (req, res) => {
  res.json({
    status: 'UP',
    service: 'jecrc-community-backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/connections', connectionRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/posts', postRoutes); // Standard endpoint alias
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/conversations', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);
app.use('/api/v1/hashtags', hashtagRoutes);
app.use('/api/v1', settingsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

const http = require('http');
const { initSocketServer } = require('./socket/socketServer');

const server = http.createServer(app);
initSocketServer(server);

// Initialize DB and start server
const startServer = async () => {
  try {
    console.log('\n\x1b[1m\x1b[31m[JU CONNECT]\x1b[0m \x1b[36mInitializing PostgreSQL Database, Socket.IO & Services...\x1b[0m');
    await migrate();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\x1b[1m\x1b[32m✔ [JECRC Backend]\x1b[0m HTTP & Socket.IO Server listening on \x1b[4mhttp://localhost:${PORT}\x1b[0m`);
      console.log(`\x1b[2m  API Base: http://localhost:${PORT}/api/v1 | WebSockets: Enabled | Static Uploads: /uploads\x1b[0m\n`);
    });
  } catch (err) {
    console.error('\x1b[31mFailed to start server:\x1b[0m', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

// Graceful Shutdown Lifecycle Handler
const gracefulShutdown = async (signal) => {
  console.log(`\n\x1b[33m[JU CONNECT SHUTDOWN]\x1b[0m Received ${signal}. Starting graceful shutdown...`);
  try {
    server.close(() => {
      console.log('✔ [HTTP Server] Stopped accepting new connections.');
    });

    const { getIO } = require('./socket/socketServer');
    try {
      const io = getIO();
      io.close(() => console.log('✔ [Socket.IO] Closed active websocket connections.'));
    } catch {}

    const db = require('./config/db');
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
      console.log('✔ [PostgreSQL Pool] All database pool connections drained cleanly.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

app.server = server;
module.exports = app;
