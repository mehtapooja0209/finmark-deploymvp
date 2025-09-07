import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { ipKeyGenerator } from 'express-rate-limit'

const isDevelopment = process.env.NODE_ENV === 'development'

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Development: 1000 requests, Production: 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiting for document upload
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 10, // Development: 50 uploads, Production: 10 uploads per windowMs
  message: {
    error: 'Upload rate limit exceeded',
    message: 'Too many uploads from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Very strict rate limiting for AI analysis
export const analysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 100 : 20, // Development: 100 analysis, Production: 20 analysis requests per hour
  message: {
    error: 'Analysis rate limit exceeded',
    message: 'Too many analysis requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Progressive delay for frequent requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: isDevelopment ? 500 : 50, // Development: 500 requests, Production: 50 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false } // Disable the warning
})

// Per-user rate limiting (requires authentication)
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: any) => {
      // Use user ID if authenticated, otherwise fall back to IP using proper IPv6 handling
      return req.user?.id || ipKeyGenerator(req)
    },
    message: {
      error: 'User rate limit exceeded',
      message: 'You have exceeded your request quota. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// AI-specific user rate limiting (expensive operations)
export const userAnalysisRateLimit = createUserRateLimit(isDevelopment ? 50 : 15, 60 * 60 * 1000) // Development: 50 per hour, Production: 15 per hour per user