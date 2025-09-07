import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { authenticateUser, AuthenticatedRequest } from './auth'
import { supabase } from '../config/supabase'
import { 
  createMockRequest, 
  createMockResponse, 
  mockSupabaseSuccess,
  mockSupabaseError,
  createMockUser 
} from '../test/helpers/mock-helpers'

// Note: Supabase is already mocked globally in setup.ts
// We'll use the existing global mock instead of creating a new one

// Mock console to avoid test output noise
const mockConsole = {
  error: jest.fn(),
  log: jest.fn(),
}

describe('Authentication Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock console
    global.console = mockConsole as any

    // Setup mock request, response, and next function using helpers
    mockReq = createMockRequest()
    mockRes = createMockResponse()
    mockNext = jest.fn()
    
    // Note: supabase is already mocked globally, no need to override
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('authenticateUser', () => {
    test('should authenticate valid user with Bearer token', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        email: 'test@example.com',
      });

      ;(mockReq as any).headers = {
        authorization: 'Bearer valid-jwt-token',
      };

      (supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSupabaseSuccess({ user: mockUser })
      )

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

    test('should handle user with no email gracefully', async () => {
      const mockUser = createMockUser({
        id: 'user-no-email',
        email: null, // No email provided
      });

      mockReq.headers = {
        authorization: 'Bearer valid-token-no-email',
      };

      (supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSupabaseSuccess({ user: mockUser })
      )

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

    test('should reject request without authorization header', async () => {
      ;(mockReq as any).headers = {} // No authorization header

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No valid authorization token provided'
      })
      expect(mockNext).not.toHaveBeenCalled()
      expect(supabase.auth.getUser).not.toHaveBeenCalled()
    })

    test('should reject request with malformed authorization header', async () => {
      ;(mockReq as any).headers = {
        authorization: 'Invalid token format',
      }

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No valid authorization token provided'
      })
      expect(mockNext).not.toHaveBeenCalled()
      expect(supabase.auth.getUser).not.toHaveBeenCalled()
    })

    test('should reject request with empty Bearer token', async () => {
      ;(mockReq as any).headers = {
        authorization: 'Bearer ',
      }

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(supabase.auth.getUser).toHaveBeenCalledWith('')
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should handle expired/invalid token from Supabase', async () => {
      mockReq.headers = {
        authorization: 'Bearer expired-token',
      };

      (supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSupabaseError('JWT expired')
      )

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(supabase.auth.getUser).toHaveBeenCalledWith('expired-token')
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should handle null user from Supabase', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-format-but-invalid-user',
      };

      (supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSupabaseSuccess({ user: null })
      )

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should handle Supabase auth service errors', async () => {
      mockReq.headers = {
        authorization: 'Bearer service-error-token',
      };

      (supabase.auth.getUser as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Supabase auth service unavailable')
      )

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Auth middleware error:',
        expect.any(Error)
      )
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should handle network timeout errors gracefully', async () => {
      ;(mockReq as any).headers = {
        authorization: 'Bearer timeout-token',
      }

      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'TimeoutError'
      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockRejectedValueOnce(timeoutError)

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      })
    })

    test('should extract token correctly from different Bearer formats', async () => {
      const testCases = [
        'Bearer valid-token-123',
        'Bearer    spaced-token-456', // Extra spaces
        'Bearer\ttoken-with-tab', // Tab character
      ]

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      for (const authHeader of testCases) {
        jest.clearAllMocks()
        
        ;(mockReq as any).headers = { authorization: authHeader }
        
        ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce(
          mockSupabaseSuccess({ user: mockUser })
        )

        await authenticateUser(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext
        )

        // Extract expected token (everything after 'Bearer ')
        const expectedToken = authHeader.substring(7)
        expect(supabase.auth.getUser).toHaveBeenCalledWith(expectedToken)
        expect(mockNext).toHaveBeenCalled()
      }
    })

    test('should not modify request if authentication fails', async () => {
      const originalReq = { ...mockReq }
      
      ;(mockReq as any).headers = {
        authorization: 'Bearer invalid-token',
      }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSupabaseError('Invalid token')
      )

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockReq.user).toBeUndefined()
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should preserve existing request properties', async () => {
      mockReq = {
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: { test: 'data' },
        params: { id: '123' },
        query: { filter: 'active' },
        user: undefined,
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      ;(supabase.auth.getUser as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSupabaseSuccess({ user: mockUser })
      )

      await authenticateUser(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      )

      expect(mockReq.headers?.['content-type']).toBe('application/json')
      expect(mockReq.body).toEqual({ test: 'data' })
      expect(mockReq.params).toEqual({ id: '123' })
      expect(mockReq.query).toEqual({ filter: 'active' })
      expect(mockReq.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      })
    })

    test('should handle case-sensitive Bearer prefix', async () => {
      const testCases = [
        'bearer valid-token', // lowercase
        'BEARER valid-token', // uppercase
        'BeArEr valid-token', // mixed case
      ]

      for (const authHeader of testCases) {
        jest.clearAllMocks()
        
        ;(mockReq as any).headers = { authorization: authHeader }

        await authenticateUser(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext
        )

        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'No valid authorization token provided'
        })
        expect(supabase.auth.getUser).not.toHaveBeenCalled()
      }
    })
  })
})