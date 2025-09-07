import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authService, RegisterData, LoginData } from '../services/auth-service'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.enhanced'
import { logger } from '../utils/logger'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const router = Router()

const isDevelopment = process.env.NODE_ENV === 'development'

// Rate limiters for auth endpoints
const authRateLimit = new RateLimiterMemory({
  points: isDevelopment ? 20 : 5, // Development: 20 attempts, Production: 5 attempts
  duration: 60 * 15, // per 15 minutes
  blockDuration: isDevelopment ? 60 * 2 : 60 * 15, // Development: 2 minutes, Production: 15 minutes block
})

const registerRateLimit = new RateLimiterMemory({
  points: isDevelopment ? 10 : 3, // Development: 10 registration attempts, Production: 3 registration attempts
  duration: 60 * 60, // per hour
  blockDuration: isDevelopment ? 60 * 30 : 60 * 60 * 2, // Development: 30 minutes, Production: 2 hours block
})

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum(['user', 'admin', 'analyst', 'auditor', 'manager']).optional()
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required')
})

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Rate limiting
    const clientKey = req.ip || 'unknown'
    
    try {
      await registerRateLimit.consume(clientKey)
    } catch (rateLimiterRes: any) {
      logger.warn('Registration rate limit exceeded:', { ip: req.ip })
      return res.status(429).json({
        error: 'Too many registration attempts',
        message: 'Please try again later',
        retryAfter: (rateLimiterRes as any)?.msBeforeNext || 3600000
      })
    }

    // Validate input
    const validationResult = registerSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid input data',
        details: validationResult.error.issues
      })
    }

    const registerData: RegisterData = validationResult.data

    // Register user
    const result = await authService.register(registerData)

    logger.info('User registration successful:', {
      userId: result.user.id,
      email: result.user.email,
      ip: req.ip
    })

    // Set secure cookie for refresh token
    res.cookie('refresh_token', result.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        session: {
          access_token: result.session.access_token,
          expires_at: result.session.expires_at,
          expires_in: result.session.expires_in
        }
      }
    })
  } catch (error) {
    logger.error('Registration error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed'
    
    res.status(400).json({
      error: 'Registration failed',
      message: errorMessage
    })
  }
})

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Rate limiting
    const clientKey = req.ip || 'unknown'
    
    try {
      await authRateLimit.consume(clientKey)
    } catch (rateLimiterRes: any) {
      logger.warn('Login rate limit exceeded:', { ip: req.ip, email: req.body.email })
      return res.status(429).json({
        error: 'Too many login attempts',
        message: 'Please try again later',
        retryAfter: (rateLimiterRes as any)?.msBeforeNext || 900000
      })
    }

    // Validate input
    const validationResult = loginSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid input data',
        details: validationResult.error.issues
      })
    }

    const loginData: LoginData = validationResult.data

    // Login user
    const result = await authService.login(loginData)

    logger.info('User login successful:', {
      userId: result.user.id,
      email: result.user.email,
      ip: req.ip
    })

    // Set secure cookie for refresh token
    res.cookie('refresh_token', result.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        session: {
          access_token: result.session.access_token,
          expires_at: result.session.expires_at,
          expires_in: result.session.expires_in
        }
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Login failed'
    
    res.status(401).json({
      error: 'Login failed',
      message: errorMessage
    })
  }
})

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    const accessToken = authHeader?.substring(7) || ''

    // Logout user
    await authService.logout(accessToken)

    // Clear refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    })

    logger.info('User logout successful:', {
      userId: req.user?.id,
      email: req.user?.email,
      ip: req.ip
    })

    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    logger.error('Logout error:', error)
    
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    })
  }
})

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public (requires refresh token)
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refresh_token || req.body.refresh_token

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'No refresh token provided'
      })
    }

    // Refresh tokens
    const result = await authService.refreshToken({ refresh_token: refreshToken })

    logger.info('Token refresh successful:', {
      userId: result.user.id,
      email: result.user.email,
      ip: req.ip
    })

    // Update refresh token cookie
    res.cookie('refresh_token', result.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    })

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        session: {
          access_token: result.session.access_token,
          expires_at: result.session.expires_at,
          expires_in: result.session.expires_in
        }
      }
    })
  } catch (error) {
    logger.error('Token refresh error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed'
    
    // Clear invalid refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    })
    
    res.status(401).json({
      error: 'Token refresh failed',
      message: errorMessage
    })
  }
})

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    const accessToken = authHeader?.substring(7) || ''

    const user = await authService.getCurrentUser(accessToken)

    res.json({
      success: true,
      data: {
        user
      }
    })
  } catch (error) {
    logger.error('Get current user error:', error)
    
    res.status(401).json({
      error: 'Authentication required',
      message: 'Invalid or expired token'
    })
  }
})

/**
 * @route GET /api/auth/verify
 * @desc Verify token validity (lightweight endpoint)
 * @access Private
 */
router.get('/verify', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      }
    }
  })
})

export default router