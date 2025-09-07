import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import middleware and utilities
import { logger, logSystem, requestLogger } from './utils/logger'
import { generalRateLimit, speedLimiter } from './middleware/rate-limiter'
import { authenticateUser, requireAdminRole, requireRole, AuthenticatedRequest } from './middleware/auth.enhanced'
import { getCacheStats } from './utils/cache'

// Import routes
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import analysisRoutes from './routes/analysis'
import batchRoutes from './routes/batch'
import marketingRoutes from './routes/marketing'
import dashboardRoutes from './routes/dashboard'
import reportRoutes from './routes/reports'
import guidelinesRoutes from './routes/guidelines'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:4028',
      'http://localhost:3000',  // Next.js default
      'http://localhost:4028',  // Vite default
      'http://localhost:5173',  // Vite alternative
      'http://localhost:5174',  // Previous Vite port
      'http://localhost:5175'   // Current Vite port
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log the rejected origin for debugging
    console.log(`CORS: Rejected origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}))
app.use(compression())

// Rate limiting and request logging
app.use(generalRateLimit)
app.use(speedLimiter)
app.use(requestLogger)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Health check endpoint with detailed stats
app.get('/health', (req, res) => {
  const uptime = process.uptime()
  const memoryUsage = process.memoryUsage()
  const cacheStats = getCacheStats()
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    cache: cacheStats
  })
})

// Secure admin endpoints - requires JWT authentication and admin role
app.get('/admin/cache', authenticateUser, requireAdminRole, (req: AuthenticatedRequest, res): void => {
  res.json({
    statistics: getCacheStats(),
    timestamp: new Date().toISOString(),
    adminUser: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role
    }
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/batch', batchRoutes)
app.use('/api/marketing', marketingRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/guidelines', guidelinesRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  logSystem.error(err, { 
    method: req.method, 
    url: req.originalUrl, 
    ip: req.ip 
  })
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 10MB'
    })
    return
  }
  
  if (err.message === 'Only PDF files are allowed') {
    res.status(400).json({
      error: 'Invalid file type',
      message: 'Only PDF files are currently supported'
    })
    return
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

// Start server (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logSystem.startup(Number(PORT), process.env.NODE_ENV || 'development')
    logger.info('🚀 AI Compliance Scanner MVP Backend Started')
    logger.info(`📁 Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`)
    logger.info('✅ All enhancements loaded:')
    logger.info('  • Rate limiting enabled') 
    logger.info('  • Input validation active')
    logger.info('  • Enhanced authentication with database-backed roles active')
    logger.info('  • Caching system ready')
    logger.info('  • Batch processing available')
    logger.info('  • Detailed logging configured')
    logger.info('  • Marketing compliance engine ready')
    logger.info('  • Google Gemini AI integration active')
    logger.info('  • RBI guidelines loaded')
  })
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logSystem.shutdown('SIGTERM received')
  process.exit(0)
})

process.on('SIGINT', () => {
  logSystem.shutdown('SIGINT received')
  process.exit(0)
})

export default app