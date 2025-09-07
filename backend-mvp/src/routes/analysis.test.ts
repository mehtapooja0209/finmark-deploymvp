import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import app from '../index'
import { AIService } from '../services/ai-service'
import { 
  mockSupabaseSuccess, 
  mockSupabaseError, 
  createMockDocument, 
  createMockAnalysisResult,
  createMockAIService
} from '../test/helpers/mock-helpers'

// Note: Supabase and Google AI are already mocked globally in setup.ts
// We'll use the existing global mocks instead of creating new ones
jest.mock('../services/ai-service')

const mockAIService = createMockAIService()

// Use the global Supabase client mock provided by setup.ts
const mockSupabaseClient: any = (global as any).mockSupabaseClient

// Mock authentication middleware to simulate authenticated user
const mockAuthenticatedUser = {
  id: 'user-123',
  email: 'test@example.com',
}

// Helper function to create authenticated request
const createAuthenticatedApp = () => {
  const express = require('express')
  const testApp = express()
  testApp.use(express.json())
  
  // Mock authentication middleware
  testApp.use((req: any, res: any, next: any) => {
    req.user = mockAuthenticatedUser
    next()
  })
  
  // Import routes after mocking
  const analysisRoutes = require('./analysis').default
  testApp.use('/api/analysis', analysisRoutes)
  
  return testApp
}

describe('Analysis API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Note: createClient is already mocked globally in setup.ts
    ;(AIService as jest.MockedClass<typeof AIService>).mockImplementation(() => mockAIService as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('POST /api/analysis/documents/:documentId/analyze', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/analysis/documents/doc123/analyze')
        .send({})

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('should return 404 for non-existent document', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().single.mockResolvedValueOnce(
        mockSupabaseError('No rows found', 'PGRST116')
      )

      const response = await request(authenticatedApp)
        .post('/api/analysis/documents/nonexistent/analyze')
        .send({})

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Document not found')
    })

    test('should return 400 for document without extracted text', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockDoc = createMockDocument({
        id: 'doc-123',
        name: 'test.pdf',
        extracted_text: null,
        user_id: 'user-123',
      })
      mockSupabaseClient.from().single.mockResolvedValueOnce(
        mockSupabaseSuccess(mockDoc)
      )

      const response = await request(authenticatedApp)
        .post('/api/analysis/documents/doc-123/analyze')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Document has no extracted text to analyze')
    })

    test('should successfully analyze document with extracted text', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockDocument = {
        id: 'doc-123',
        name: 'test.pdf',
        extracted_text: 'This is a test document for compliance analysis.',
        user_id: 'user-123',
      }

      const mockAnalysisResult = {
        id: 'analysis-123',
        compliance_score: 85,
        violations: [],
        recommendations: ['Improve disclosure language'],
      }

      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      })
      mockSupabaseClient.from().update.mockResolvedValueOnce({ error: null })
      mockAIService.analyzeCompliance.mockResolvedValueOnce(mockAnalysisResult)

      const response = await request(authenticatedApp)
        .post('/api/analysis/documents/doc-123/analyze')
        .send({})

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Document analyzed successfully')
      expect(response.body.analysis).toEqual(mockAnalysisResult)
      expect(mockAIService.analyzeCompliance).toHaveBeenCalledWith(
        mockDocument.extracted_text,
        'doc-123',
        'user-123'
      )
    })

    test('should handle AI service errors gracefully', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: {
          id: 'doc-123',
          extracted_text: 'Test document',
          user_id: 'user-123',
        },
        error: null,
      })
      mockSupabaseClient.from().update.mockResolvedValue({ error: null })
      mockAIService.analyzeCompliance.mockRejectedValueOnce(new Error('AI service unavailable'))

      const response = await request(authenticatedApp)
        .post('/api/analysis/documents/doc-123/analyze')
        .send({})

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to analyze document')
      expect(response.body.details).toBe('AI service unavailable')
    })
  })

  describe('GET /api/analysis/documents/:documentId/results', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analysis/documents/doc123/results')

      expect(response.status).toBe(401)
    })

    test('should return analysis results for authenticated user', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockAnalysisResults = [
        {
          id: 'result-1',
          document_id: 'doc-123',
          compliance_score: 85,
          violations: [],
        },
      ]

      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: mockAnalysisResults,
        error: null,
      })

      const response = await request(authenticatedApp)
        .get('/api/analysis/documents/doc-123/results')

      expect(response.status).toBe(200)
      expect(response.body.analysisResults).toEqual(mockAnalysisResults)
    })

    test('should handle database errors', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const response = await request(authenticatedApp)
        .get('/api/analysis/documents/doc-123/results')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to retrieve analysis results')
    })
  })

  describe('GET /api/analysis/results', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analysis/results')

      expect(response.status).toBe(401)
    })

    test('should return all analysis results for authenticated user', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockResults = [
        {
          id: 'result-1',
          compliance_score: 85,
          documents: { name: 'doc1.pdf' },
          violations: [],
        },
        {
          id: 'result-2',
          compliance_score: 72,
          documents: { name: 'doc2.pdf' },
          violations: [{ type: 'disclosure', severity: 'medium' }],
        },
      ]

      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: mockResults,
        error: null,
      })

      const response = await request(authenticatedApp)
        .get('/api/analysis/results')

      expect(response.status).toBe(200)
      expect(response.body.analysisResults).toEqual(mockResults)
      expect(response.body.analysisResults).toHaveLength(2)
    })

    test('should return empty array when no results exist', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const response = await request(authenticatedApp)
        .get('/api/analysis/results')

      expect(response.status).toBe(200)
      expect(response.body.analysisResults).toEqual([])
    })
  })
})