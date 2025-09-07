import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'
import app from '../index'
import { batchProcessor } from '../services/batch-processor'

// Mock dependencies
jest.mock('../services/batch-processor')

// Use the global Supabase mock exposed by setup.ts for consistency across tests
const mockSupabaseClient: any = (global as any).mockSupabaseClient

const mockBatchProcessor = {
  createBatchJob: jest.fn() as jest.MockedFunction<any>,
  getBatchJobStatus: jest.fn() as jest.MockedFunction<any>,
  cancelBatchJob: jest.fn() as jest.MockedFunction<any>,
  getUserBatchJobs: jest.fn() as jest.MockedFunction<any>,
}

// Mock authentication middleware
const mockAuthenticatedUser = {
  id: 'user-123',
  email: 'test@example.com',
}

// Helper function to create authenticated app
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
  const batchRoutes = require('./batch').default
  testApp.use('/api/batch', batchRoutes)
  
  return testApp
}

describe('Batch API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabaseClient as any)
    Object.assign(batchProcessor, mockBatchProcessor)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('POST /api/batch/analyze', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/batch/analyze')
        .send({
          documentIds: ['doc-1', 'doc-2']
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('should validate request body - missing documentIds', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const response = await request(authenticatedApp)
        .post('/api/batch/analyze')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
      expect(response.body.details).toHaveLength(1)
    })

    test('should validate request body - empty documentIds array', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const response = await request(authenticatedApp)
        .post('/api/batch/analyze')
        .send({
          documentIds: []
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
    })

    test('should validate request body - too many documentIds', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const tooManyIds = Array.from({ length: 51 }, (_, i) => `doc-${i}`)
      
      const response = await request(authenticatedApp)
        .post('/api/batch/analyze')
        .send({
          documentIds: tooManyIds
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
    })

    test('should validate request body - invalid UUID format', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const response = await request(authenticatedApp)
        .post('/api/batch/analyze')
        .send({
          documentIds: ['invalid-uuid', 'another-invalid']
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid request data')
    })

    test('should successfully create batch job with valid data', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const validDocumentIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002'
      ]

      const mockJobId = 'job-123'
      ;(mockBatchProcessor.createBatchJob as jest.MockedFunction<any>).mockResolvedValueOnce(mockJobId)

      const response = await request(authenticatedApp)
        .post('/api/batch/analyze')
        .send({
          documentIds: validDocumentIds
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Batch analysis job created')
      expect(response.body.jobId).toBe(mockJobId)
      expect(response.body.documentCount).toBe(2)
      expect(mockBatchProcessor.createBatchJob).toHaveBeenCalledWith(
        'user-123',
        validDocumentIds,
        undefined
      )
    })

    test('should create batch job with options', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const validDocumentIds = ['550e8400-e29b-41d4-a716-446655440001']
      const options = {
        concurrency: 5,
        retryAttempts: 3,
        timeoutMs: 60000,
        skipDuplicates: true,
        notifyOnComplete: true
      }

      ;(mockBatchProcessor.createBatchJob as jest.MockedFunction<any>).mockResolvedValueOnce('job-123')

      const response = await request(authenticatedApp)
        .post('/api/batch/analyze')
        .send({
          documentIds: validDocumentIds,
          options
        })

      expect(response.status).toBe(201)
      expect(mockBatchProcessor.createBatchJob).toHaveBeenCalledWith(
        'user-123',
        validDocumentIds,
        options
      )
    })

    test('should handle batch processor errors', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const validDocumentIds = ['550e8400-e29b-41d4-a716-446655440001']
      ;(mockBatchProcessor.createBatchJob as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Batch processor service unavailable')
      )

      const response = await request(authenticatedApp)
        .post('/api/batch/analyze')
        .send({
          documentIds: validDocumentIds
        })

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to create batch analysis job')
      expect(response.body.details).toBe('Batch processor service unavailable')
    })
  })

  describe('GET /api/batch/jobs/:jobId/status', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/batch/jobs/job-123/status')

      expect(response.status).toBe(401)
    })

    test('should return job status for existing job', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockJob = {
        id: 'job-123',
        status: 'processing',
        progress: { completed: 2, total: 5 },
        createdAt: '2024-01-01T00:00:00Z',
        results: []
      }

      ;(mockBatchProcessor.getBatchJobStatus as jest.MockedFunction<any>).mockResolvedValueOnce(mockJob)

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs/job-123/status')

      expect(response.status).toBe(200)
      expect(response.body.job).toEqual(mockJob)
      expect(mockBatchProcessor.getBatchJobStatus).toHaveBeenCalledWith('job-123', 'user-123')
    })

    test('should return 404 for non-existent job', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      ;(mockBatchProcessor.getBatchJobStatus as jest.MockedFunction<any>).mockResolvedValueOnce(null)

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs/nonexistent/status')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Batch job not found')
    })

    test('should handle service errors', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      ;(mockBatchProcessor.getBatchJobStatus as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs/job-123/status')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to get batch job status')
    })
  })

  describe('POST /api/batch/jobs/:jobId/cancel', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/batch/jobs/job-123/cancel')

      expect(response.status).toBe(401)
    })

    test('should successfully cancel job', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      ;(mockBatchProcessor.cancelBatchJob as jest.MockedFunction<any>).mockResolvedValueOnce(true)

      const response = await request(authenticatedApp)
        .post('/api/batch/jobs/job-123/cancel')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Batch job cancelled successfully')
      expect(mockBatchProcessor.cancelBatchJob).toHaveBeenCalledWith('job-123', 'user-123')
    })

    test('should return 400 when job cannot be cancelled', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      ;(mockBatchProcessor.cancelBatchJob as jest.MockedFunction<any>).mockResolvedValueOnce(false)

      const response = await request(authenticatedApp)
        .post('/api/batch/jobs/job-123/cancel')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Cannot cancel job')
    })

    test('should handle service errors', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      ;(mockBatchProcessor.cancelBatchJob as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Service unavailable')
      )

      const response = await request(authenticatedApp)
        .post('/api/batch/jobs/job-123/cancel')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to cancel batch job')
    })
  })

  describe('GET /api/batch/jobs', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/batch/jobs')

      expect(response.status).toBe(401)
    })

    test('should return user batch jobs with summary', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockJobs = [
        { id: 'job-1', status: 'completed', progress: { completed: 5, total: 5 } },
        { id: 'job-2', status: 'processing', progress: { completed: 2, total: 3 } },
        { id: 'job-3', status: 'failed', progress: { completed: 0, total: 2 } },
      ]

      ;(mockBatchProcessor.getUserBatchJobs as jest.MockedFunction<any>).mockResolvedValueOnce(mockJobs)

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs')

      expect(response.status).toBe(200)
      expect(response.body.jobs).toEqual(mockJobs)
      expect(response.body.summary).toEqual({
        total: 3,
        pending: 0,
        processing: 1,
        completed: 1,
        failed: 1,
        partial: 0,
      })
    })

    test('should return empty jobs array when no jobs exist', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      ;(mockBatchProcessor.getUserBatchJobs as jest.MockedFunction<any>).mockResolvedValueOnce([])

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs')

      expect(response.status).toBe(200)
      expect(response.body.jobs).toEqual([])
      expect(response.body.summary.total).toBe(0)
    })
  })

  describe('GET /api/batch/jobs/:jobId/results', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/batch/jobs/job-123/results')

      expect(response.status).toBe(401)
    })

    test('should return job results with analysis data', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockJob = {
        id: 'job-123',
        status: 'completed',
        progress: { completed: 2, total: 2 },
        createdAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:05:00Z',
        results: [
          { documentId: 'doc-1', status: 'success' },
          { documentId: 'doc-2', status: 'success' },
        ]
      }

      const mockAnalysisResults = [
        {
          id: 'result-1',
          document_id: 'doc-1',
          compliance_score: 85,
          documents: { name: 'doc1.pdf' },
          violations: []
        },
        {
          id: 'result-2',
          document_id: 'doc-2',
          compliance_score: 72,
          documents: { name: 'doc2.pdf' },
          violations: [{ type: 'disclosure', severity: 'medium' }]
        }
      ]

      ;(mockBatchProcessor.getBatchJobStatus as jest.MockedFunction<any>).mockResolvedValueOnce(mockJob)
      ;(mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
        order: jest.fn().mockResolvedValueOnce({
          data: mockAnalysisResults,
          error: null,
        } as any) as any
      })

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs/job-123/results')

      expect(response.status).toBe(200)
      expect(response.body.job.id).toBe('job-123')
      expect(response.body.job.status).toBe('completed')
      expect(response.body.results.analysisResults).toEqual(mockAnalysisResults)
      expect(response.body.results.summary).toEqual(mockJob.results)
    })

    test('should return 404 for non-existent job', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      ;(mockBatchProcessor.getBatchJobStatus as jest.MockedFunction<any>).mockResolvedValueOnce(null)

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs/nonexistent/results')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Batch job not found')
    })

    test('should handle database errors when fetching analysis results', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockJob = {
        id: 'job-123',
        status: 'completed',
        results: [{ documentId: 'doc-1', status: 'success' }]
      }

      ;(mockBatchProcessor.getBatchJobStatus as jest.MockedFunction<any>).mockResolvedValueOnce(mockJob)
      ;(mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
        order: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        } as any) as any
      })

      const response = await request(authenticatedApp)
        .get('/api/batch/jobs/job-123/results')

      // Should still return job data even if analysis results fail to load
      expect(response.status).toBe(200)
      expect(response.body.job.id).toBe('job-123')
      expect(response.body.results.analysisResults).toEqual([])
    })
  })
})