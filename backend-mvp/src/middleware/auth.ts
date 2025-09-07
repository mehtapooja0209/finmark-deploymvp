import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role?: string
  }
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    /* Authentication temporarily disabled
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
      email: user.email || ''
    }
    */
    
    // Authentication bypass - set mock user context
    req.user = {
      id: 'mock-user-id',
      email: 'mock-user@example.com'
    }
    
    // Log authentication bypass
    console.log('Authentication bypassed:', {
      timestamp: new Date().toISOString(),
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
}

// Admin role validation middleware - requires authenticateUser to be called first
export const requireAdminRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    /* Admin role validation temporarily disabled
    // Ensure user is authenticated first
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Admin access requires authentication'
      })
    }

    // For now, check if user email contains admin indicators
    // In production, this should check a proper user_roles table
    const userEmail = req.user.email.toLowerCase()
    const isAdmin = userEmail.includes('admin') || userEmail.includes('superuser')
    
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
    */
    
    // Admin role validation bypass
    if (!req.user) {
      req.user = {
        id: 'mock-admin-id',
        email: 'mock-admin@example.com'
      }
    }
    
    // Set admin role
    req.user.role = 'admin'
    
    // Log admin bypass
    console.log('Admin role validation bypassed:', {
      timestamp: new Date().toISOString(),
      ip: req.ip
    })
    
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