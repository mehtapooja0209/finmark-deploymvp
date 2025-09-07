import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { authenticateUser, requireAdminRole, AuthenticatedRequest } from './auth'
import { supabase } from '../config/supabase'

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}))

// Mock console to control test output
const mockConsole = {
  error: jest.fn(),
  log: jest.fn(),
}

describe('🔒 SECURITY HARDENED Authentication Tests', () => {
  let mockReq: Partial<AuthenticatedRequest>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock console
    global.console = mockConsole as any

    // Setup fresh mocks for each test  
    mockReq = {
      headers: {},
      get: jest.fn() as jest.MockedFunction<any>,
    }
    
    // Add ip property separately to avoid readonly issues
    Object.defineProperty(mockReq, 'ip', {
      writable: true,
      configurable: true,
      value: '127.0.0.1'
    })
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any
    
    mockNext = jest.fn()

    // Reset NODE_ENV for each test
    delete process.env.NODE_ENV
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('🚫 BYPASS PREVENTION TESTS', () => {
    test('CRITICAL: Should REJECT requests without Authorization header in ALL environments', async () => {
      // Test in development mode
      process.env.NODE_ENV = 'development'
      mockReq.headers = {}

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authorization required',
        message: 'Please provide a valid Bearer token in the Authorization header'
      })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    test('CRITICAL: Should REJECT requests without Authorization header in production', async () => {
      process.env.NODE_ENV = 'production'
      mockReq.headers = {}

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authorization required',
        message: 'Please provide a valid Bearer token in the Authorization header'
      })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    test('CRITICAL: Should REJECT malformed authorization headers', async () => {
      const malformedHeaders = [
        'Invalid token format',
        'bearer lowercase-bearer',  // lowercase
        'BEARER uppercase-bearer',  // uppercase
        'Basic username:password',  // Basic auth
        'Token jwt-token',         // Wrong prefix
        'Bearer',                  // Missing token
        'Bearer ',                 // Empty token
        'Bearer\t\t',             // Tab characters only
      ]

      for (const authHeader of malformedHeaders) {
        jest.clearAllMocks()
        mockReq.headers = { authorization: authHeader }

        await authenticateUser(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext
        )

        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockNext).not.toHaveBeenCalled()
        expect(mockReq.user).toBeUndefined()
      }
    })

    test('CRITICAL: Should NEVER bypass on Supabase errors in ANY environment', async () => {
      process.env.NODE_ENV = 'development' // Most permissive environment
      mockReq.headers = { authorization: 'Bearer invalid-token' }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired' }
      })

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    test('CRITICAL: Should NEVER bypass on system exceptions', async () => {
      process.env.NODE_ENV = 'development'
      mockReq.headers = { authorization: 'Bearer system-error-token' }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Network timeout')
      )

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication system error',
        message: 'Please try again later'
      })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    test('CRITICAL: Should REJECT service role key attempts', async () => {
      // This should be treated as a regular token, not a bypass
      const fakeServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake-service-role'
      process.env.SUPABASE_SERVICE_ROLE_KEY = fakeServiceRoleKey
      
      mockReq.headers = { authorization: `Bearer ${fakeServiceRoleKey}` }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid JWT' }
      })

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      // Should be treated as invalid token, not bypass
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })
  })

  describe('✅ SECURE AUTHENTICATION TESTS', () => {
    test('Should authenticate valid user with proper JWT token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockReq.headers = { authorization: 'Bearer valid-jwt-token' }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-jwt-token')
      expect(mockReq.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      })
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    test('Should handle user with no email gracefully', async () => {
      const mockUser = {
        id: 'user-no-email',
        email: null,
      }

      mockReq.headers = { authorization: 'Bearer valid-token-no-email' }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockReq.user).toEqual({
        id: 'user-no-email',
        email: '',
      })
      expect(mockNext).toHaveBeenCalled()
    })

    test('Should log authentication failures for monitoring', async () => {
      mockReq.headers = { authorization: 'Bearer expired-token' }
      Object.defineProperty(mockReq, 'ip', {
        writable: true,
        configurable: true,
        value: '192.168.1.100'
      })

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired' }
      })

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockConsole.log).toHaveBeenCalledWith('Authentication failed:', {
        timestamp: expect.any(String),
        ip: '192.168.1.100',
        userAgent: 'Test-Agent/1.0',
        error: 'JWT expired'
      })
    })

    test('Should log successful authentication for monitoring', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockReq.headers = { authorization: 'Bearer valid-token' }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockConsole.log).toHaveBeenCalledWith('User authenticated:', {
        timestamp: expect.any(String),
        userId: 'user-123',
        email: 'test@example.com',
        ip: '127.0.0.1'
      })
    })
  })

  describe('👑 ADMIN ROLE TESTS', () => {
    beforeEach(() => {
      // Set up authenticated user for admin tests
      mockReq.user = {
        id: 'user-123',
        email: 'admin@example.com'
      }
      Object.defineProperty(mockReq, 'ip', {
        writable: true,
        configurable: true,
        value: '127.0.0.1'
      })
    })

    test('Should grant admin access to users with admin email', async () => {
      mockReq.user!.email = 'admin@company.com'

      await requireAdminRole(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockReq.user!.role).toBe('admin')
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    test('Should grant admin access to superuser emails', async () => {
      mockReq.user!.email = 'superuser@company.com'

      await requireAdminRole(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockReq.user!.role).toBe('admin')
      expect(mockNext).toHaveBeenCalled()
    })

    test('Should DENY admin access to regular users', async () => {
      mockReq.user!.email = 'regular.user@company.com'

      await requireAdminRole(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        message: 'This endpoint requires administrator privileges'
      })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user!.role).toBeUndefined()
    })

    test('Should DENY admin access to unauthenticated users', async () => {
      mockReq.user = undefined

      await requireAdminRole(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Admin access requires authentication'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('Should log admin access attempts', async () => {
      mockReq.user!.email = 'admin@company.com'

      await requireAdminRole(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockConsole.log).toHaveBeenCalledWith('Admin access granted:', {
        timestamp: expect.any(String),
        userId: 'user-123',
        email: 'admin@company.com',
        ip: '127.0.0.1'
      })
    })

    test('Should log admin access denials', async () => {
      mockReq.user!.email = 'hacker@evil.com'

      await requireAdminRole(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockConsole.log).toHaveBeenCalledWith('Admin access denied:', {
        timestamp: expect.any(String),
        userId: 'user-123',
        email: 'hacker@evil.com',
        ip: '127.0.0.1'
      })
    })
  })

  describe('🛡️ SECURITY EDGE CASES', () => {
    test('Should handle token with leading/trailing whitespace', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockReq.headers = { authorization: 'Bearer   whitespace-token   ' }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(supabase.auth.getUser).toHaveBeenCalledWith('whitespace-token')
      expect(mockNext).toHaveBeenCalled()
    })

    test('Should reject empty Bearer token', async () => {
      mockReq.headers = { authorization: 'Bearer ' }

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token format',
        message: 'Bearer token cannot be empty'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('Should handle Supabase network errors gracefully', async () => {
      mockReq.headers = { authorization: 'Bearer network-error-token' }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Network timeout')
      )

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockConsole.error).toHaveBeenCalledWith('Auth middleware system error:', {
        timestamp: expect.any(String),
        error: 'Network timeout',
        stack: expect.any(String),
        ip: '127.0.0.1'
      })

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})