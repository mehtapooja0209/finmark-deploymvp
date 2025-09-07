import winston from 'winston'
import { Request } from 'express'

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each level
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
})

// Create custom formats
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `[${timestamp}] ${level}: ${message} ${metaStr}`
  })
)

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: consoleFormat,
  }),
  
  // Error log file
  new winston.transports.File({
    level: 'error',
    filename: 'logs/error.log',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
]

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  transports,
  exitOnError: false,
})

// Request logging middleware
export const requestLogger = (req: Request & { user?: any }, res: any, next: any) => {
  const startTime = Date.now()
  
  // Log request
  logger.http('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  })
  
  // Override res.json to log response
  const originalJson = res.json
  res.json = function (body: any) {
    const duration = Date.now() - startTime
    
    logger.http('HTTP Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      responseSize: JSON.stringify(body).length,
    })
    
    return originalJson.call(this, body)
  }
  
  next()
}

// Structured logging functions
export const logAnalysis = {
  start: (documentId: string, userId: string, textLength: number) => {
    logger.info('Analysis started', {
      event: 'analysis_start',
      documentId,
      userId,
      textLength,
      timestamp: new Date().toISOString(),
    })
  },
  
  complete: (documentId: string, userId: string, duration: number, complianceScore: number) => {
    logger.info('Analysis completed', {
      event: 'analysis_complete',
      documentId,
      userId,
      duration,
      complianceScore,
      timestamp: new Date().toISOString(),
    })
  },
  
  error: (documentId: string, userId: string, error: Error, duration?: number) => {
    logger.error('Analysis failed', {
      event: 'analysis_error',
      documentId,
      userId,
      duration,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      timestamp: new Date().toISOString(),
    })
  },
}

export const logDocument = {
  upload: (documentId: string, userId: string, fileName: string, fileSize: number) => {
    logger.info('Document uploaded', {
      event: 'document_upload',
      documentId,
      userId,
      fileName,
      fileSize,
      timestamp: new Date().toISOString(),
    })
  },
  
  delete: (documentId: string, userId: string) => {
    logger.info('Document deleted', {
      event: 'document_delete',
      documentId,
      userId,
      timestamp: new Date().toISOString(),
    })
  },
  
  textExtracted: (documentId: string, textLength: number, extractionTime: number) => {
    logger.info('Text extracted from document', {
      event: 'text_extraction',
      documentId,
      textLength,
      extractionTime,
      timestamp: new Date().toISOString(),
    })
  },
}

export const logAuth = {
  success: (userId: string, ip: string, userAgent?: string) => {
    logger.info('Authentication successful', {
      event: 'auth_success',
      userId,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    })
  },
  
  failure: (ip: string, reason: string, userAgent?: string) => {
    logger.warn('Authentication failed', {
      event: 'auth_failure',
      ip,
      reason,
      userAgent,
      timestamp: new Date().toISOString(),
    })
  },
  
  rateLimited: (ip: string, endpoint: string, userAgent?: string) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString(),
    })
  },
}

export const logSystem = {
  startup: (port: number, environment: string) => {
    logger.info('Server started', {
      event: 'server_startup',
      port,
      environment,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    })
  },
  
  shutdown: (reason?: string) => {
    logger.info('Server shutdown', {
      event: 'server_shutdown',
      reason,
      timestamp: new Date().toISOString(),
    })
  },
  
  error: (error: Error, context?: any) => {
    logger.error('System error', {
      event: 'system_error',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      timestamp: new Date().toISOString(),
    })
  },
}

// Performance monitoring
export const performanceLogger = {
  track: <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now()
    
    logger.debug('Operation started', {
      event: 'operation_start',
      operation,
      timestamp: new Date().toISOString(),
    })
    
    return fn()
      .then(result => {
        const duration = Date.now() - startTime
        logger.debug('Operation completed', {
          event: 'operation_complete',
          operation,
          duration,
          timestamp: new Date().toISOString(),
        })
        return result
      })
      .catch(error => {
        const duration = Date.now() - startTime
        logger.error('Operation failed', {
          event: 'operation_error',
          operation,
          duration,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          timestamp: new Date().toISOString(),
        })
        throw error
      })
  },
}

// Ensure logs directory exists
import { existsSync, mkdirSync } from 'fs'
if (!existsSync('logs')) {
  mkdirSync('logs', { recursive: true })
}