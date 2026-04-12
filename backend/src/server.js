'use strict';
const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') {
  const envFile = process.env.ENV_FILE || '.env.development';
  dotenv.config({ path: envFile });
  console.log(`Loaded environment from: ${envFile}`);
}
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('GOOGLE_CLIENT_ID loaded:', !!process.env.GOOGLE_CLIENT_ID);
require('express-async-errors');

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression= require('compression');
const morgan     = require('morgan');
const passport   = require('passport');
const { createServer } = require('http');
const { Server }       = require('socket.io');

const { connectPostgres } = require('./config/postgres');
const { connectMongo }    = require('./config/mongo');
const { connectRedis }    = require('./config/redis');
const { initFirebase }    = require('./config/firebase');
const { setupPassport }   = require('./config/passport');
const { setupSocketIO }   = require('./config/socket');
const { startCronJobs }   = require('./jobs/cronJobs');
const { errorHandler }    = require('./middleware/errorHandler');
const { rateLimiter }     = require('./middleware/rateLimiter');
const logger              = require('./utils/logger');

// ── Routes ──
const authRoutes          = require('./routes/auth');
const userRoutes          = require('./routes/users');
const plannerRoutes       = require('./routes/planner');
const fileRoutes          = require('./routes/files');
const notesRoutes         = require('./routes/notes');
const boardRoutes         = require('./routes/board');
const chatRoutes          = require('./routes/chat');
const aiRoutes            = require('./routes/ai');
const notificationRoutes  = require('./routes/notifications');
const achievementRoutes   = require('./routes/achievements');
const quizRoutes          = require('./routes/quiz');
const subjectRoutes       = require('./routes/subjects');
const analyticsRoutes     = require('./routes/analytics');
const groupRoutes         = require('./routes/groups');
const toolRoutes          = require('./routes/tools');

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowed = [
        process.env.CLIENT_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3001',
        'https://njaheg-theta.vercel.app',
        'http://localhost',
        'https://localhost',
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET','POST'],
    credentials: true,
  },
  transports: ['websocket','polling'],
});

const path = require('path');

// ── Health check (Pre-middleware) ──
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV })
);

// ── Global Middleware ──
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false })); // Allow cross-origin images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://njaheg-theta.vercel.app',
      'http://localhost',
      'https://localhost',
    ].filter(Boolean);
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: m => logger.info(m.trim()) } }));
app.use(passport.initialize());

// ── Rate limiter on all /api routes ──
app.use('/api/', rateLimiter);



// ── API Routes ──
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/planner',       plannerRoutes);
app.use('/api/files',         fileRoutes);
app.use('/api/notes',         notesRoutes);
app.use('/api/board',         boardRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/achievements',   achievementRoutes);
app.use('/api/quiz',          quizRoutes);
app.use('/api/subjects',      subjectRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/groups',        groupRoutes);
app.use('/api/tools',         toolRoutes);

// ── 404 ──
app.use('*', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──
app.use(errorHandler);

// ── Boot sequence ──
async function start() {
  try {
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0'; 
    
    // Start listening immediately so healthchecks pass
    httpServer.listen(PORT, HOST, () => {
      logger.info(`🚀 Najah API running on ${HOST}:${PORT} [${process.env.NODE_ENV || 'dev'}]`);
      logger.info('⏳ Connecting to databases in background...');
    });

    // Databases - parallel connecting
    Promise.allSettled([
      connectPostgres().catch(e => logger.warn('⚠️  Postgres unavailable:', e.message)),
      connectMongo().catch(e => logger.warn('⚠️  MongoDB unavailable:', e.message)),
      connectRedis().catch(e => logger.warn('⚠️  Redis unavailable:', e.message))
    ]).then(() => {
      logger.info('📢 Database initialization sequence complete');
      
      // Start non-critical services
      try { initFirebase(); } catch(e) { logger.warn('⚠️  Firebase unavailable:', e.message); }
      try { setupPassport(); } catch(e) { logger.warn('⚠️  Passport unavailable:', e.message); }
      try { setupSocketIO(io); } catch(e) { logger.warn('⚠️  Socket.IO unavailable:', e.message); }
      try { startCronJobs(); } catch(e) { logger.warn('⚠️  Cron jobs unavailable:', e.message); }
    });

  } catch (err) {
    logger.error('Fatal startup error:', err);
    process.exit(1);
  }
}

start();
module.exports = { app, io };
