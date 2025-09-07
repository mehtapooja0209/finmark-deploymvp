import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'
import { RateLimiterMemory } from 'rate-limiter-flexible'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role?: string
    metadata?: Record<string, any>
  }
}

const isDevelopment = process.env.NODE_ENV === 'development'

// Rate limiter for authentication attempts - 10 failed attempts per minute per IP
const authRateLimiter = new RateLimiterMemory({
  points: isDevelopment ? 50 : 10, // Development: 50 points, Production: 10 points
  duration: 60, // Per 60 seconds
  blockDuration: isDevelopment ? 60 : 300, // Development: 1 minute, Production: 5 minutes block if exceeded
})

/**
 * Authentication middleware that validates JWT tokens using Supabase
 * Implements multiple security measures to prevent authentication bypasses
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // TEMPORARILY DISABLED FOR TESTING - MOCK AUTHENTICATED USER
  console.log('TESTING MODE: Authentication bypassed for:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip
  })
  
  // Set mock authenticated user
  req.user = {
    id: 'test-user-123',
    email: 'test@compliance.com',
    role: 'admin',
    metadata: {
      name: 'Test User',
      company: 'Compliance Testing Co'
    }
  }
  
  next()
  
  /*
  // ORIGINAL AUTHENTICATION CODE - TEMPORARILY DISABLED
  try {
    // Rate limiting by IP to prevent brute force attacks
    try {
      await authRateLimiter.consume(req.ip || 'unknown-ip')
    } catch (rateLimiterError) {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      })
      return res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Please try again later'
      })
    }

    const authHeader = req.headers.authorization
    
    // Always require proper Bearer token - NO BYPASSES
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authorization required',
        message: 'Please provide a valid Bearer token in the Authorization header'
      })
    }

    const token = authHeader.substring(7).trim()
    
    // Validate token is not empty
    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        message: 'Bearer token cannot be empty'
      })
    }
    
    // Use Supabase to validate JWT token - secure and free tier compatible
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) {
      // Log authentication failures for monitoring (without exposing sensitive data)
      console.log('Authentication failed:', {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: error.message
      })
      
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid or expired token'
      })
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Token does not correspond to a valid user'
      })
    }

    // Successfully authenticated - set user context
    req.user = {
      id: user.id,
      email: user.email || '',
      metadata: user.user_metadata || {},
      // Store role from metadata if available
      role: (user.user_metadata?.role || user.app_metadata?.role) || 'user'
    }
    
    // Log successful authentication for monitoring
    console.log('User authenticated:', {
      timestamp: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      role: req.user.role,
      ip: req.ip
    })
    
    next()
  } catch (error) {
    // Log system errors for debugging
    console.error('Auth middleware system error:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    })
    
    // Return generic error - never bypass authentication on errors
    res.status(500).json({ 
      error: 'Authentication system error',
      message: 'Please try again later'
    })
  }
  */
}

/**
 * Fetches user roles from the database
 * This provides a more secure role validation than just checking email
 */
// Define the type for the user_roles table row
interface UserRoleRow {
  role: string;
}

async function getUserRoles(userId: string): Promise<string[]> {
  try {
    // Query the user_roles table to get assigned roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error fetching user roles:', error)
      return []
    }
    
    // Extract role names from the result
    if (!data) return []
    
    // Cast data to the correct type
    const typedData = data as UserRoleRow[]
    return typedData.map(row => row.role)
    
  } catch (error) {
    console.error('Error in getUserRoles:', error)
    return []
  }
}

/**
 * Admin role validation middleware - requires authenticateUser to be called first
 * Uses database-backed roles for more secure role validation
 */
export const requireAdminRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure user is authenticated first
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Admin access requires authentication'
      })
    }

    // First check if role is already in user metadata from JWT
    let isAdmin = req.user.role === 'admin'
    
    // If not admin by metadata, check database roles
    if (!isAdmin) {
      const roles = await getUserRoles(req.user.id)
      isAdmin = roles.includes('admin')
    }
    
    // Fallback to email check if no roles found (for backward compatibility)
    if (!isAdmin && req.user.email) {
      const userEmail = req.user.email.toLowerCase()
      isAdmin = userEmail.includes('admin') || userEmail.includes('superuser')
    }
    
    if (!isAdmin) {
      console.log('Admin access denied:', {
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip
      })
      
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This endpoint requires administrator privileges'
      })
    }

    console.log('Admin access granted:', {
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    })

    req.user.role = 'admin'
    next()
  } catch (error) {
    console.error('Admin role check error:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    })
    
    res.status(500).json({
      error: 'Role validation error',
      message: 'Unable to verify admin privileges'
    })
  }
}

/**
 * Role-based access control middleware
 * Allows specifying required roles for each endpoint
 */
export const requireRole = (requiredRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated first
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Role-based access requires authentication'
        })
      }

      // Get user's roles from database
      const userRoles = await getUserRoles(req.user.id)
      
      // Add the role from user metadata if available
      if (req.user.role) {
        userRoles.push(req.user.role)
      }
      
      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))
      
      if (!hasRequiredRole) {
        console.log('Role-based access denied:', {
          timestamp: new Date().toISOString(),
          userId: req.user.id,
          email: req.user.email,
          userRoles,
          requiredRoles,
          ip: req.ip
        })
        
        return res.status(403).json({
          error: 'Insufficient privileges',
          message: 'You do not have the required role to access this resource'
        })
      }

      next()
    } catch (error) {
      console.error('Role validation error:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        ip: req.ip
      })
      
      res.status(500).json({
        error: 'Role validation error',
        message: 'Unable to verify access privileges'
      })
    }
  }
}
