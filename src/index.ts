import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ── Security Middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

// ── Rate Limiting ──
app.use('/api', apiLimiter);

// ── Request Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health Check / Welcome ──
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Zorvyn Finance API — Backend is operational',
    version: '1.0.0',
    documentation: 'See README.md for complete API documentation',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      records: '/api/records',
      dashboard: '/api/dashboard',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API Routes ──
app.use('/api', routes);

// ── 404 Handler ──
app.use(notFoundHandler);

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server (only when not imported for testing) ──
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`\n🚀 Zorvyn Finance API is running on http://localhost:${port}`);
    console.log(`📄 API routes available at http://localhost:${port}/api`);
    console.log(`🏥 Health check at http://localhost:${port}/health\n`);
  });
}

export default app;
