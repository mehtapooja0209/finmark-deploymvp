import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { BatchProcessor } from './batch-processor'
import { supabase } from '../config/supabase'
import { AIService } from './ai-service'
import { DocumentProcessor } from './document-processor'

// Mock dependencies
jest.mock('../config/supabase')
jest.mock('./ai-service')
jest.mock('./document-processor')
jest.mock('../utils/logger')

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn() as jest.MockedFunction<any>,
    order: jest.fn().mockReturnThis(),
  })),
}

const mockAIService = {
  analyzeCompliance: jest.fn() as jest.MockedFunction<any>,
}

const mockDocumentProcessor = {
  processDocument: jest.fn() as jest.MockedFunction<any>,
}

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}

// Mock console to avoid test output noise
const mockConsole = {
  error: jest.fn(),
  log: jest.fn(),
}

describe('BatchProcessor', () => {
  let batchProcessor: BatchProcessor

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock supabase
    Object.assign(supabase, mockSupabase)
    
    // Mock services
    ;(AIService as jest.MockedClass<typeof AIService>).mockImplementation(() => mockAIService as any)
    ;(DocumentProcessor as jest.MockedClass<typeof DocumentProcessor>).mockImplementation(() => mockDocumentProcessor as any)
    
    // Mock logger
    const logger = require('../utils/logger')
    Object.assign(logger, { logger: mockLogger, logAnalysis: mockLogger, performanceLogger: mockLogger })
    
    // Mock console
    global.console = mockConsole as any

    batchProcessor = new BatchProcessor()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createBatchJob', () => {
    test('should create batch job successfully', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1', 'doc-2', 'doc-3']
      
      // Mock documents validation
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
          { id: 'doc-2', status: 'uploaded', extracted_text: 'Document 2 text' },
          { id: 'doc-3', status: 'uploaded', extracted_text: 'Document 3 text' },
        ],
        error: null,
      } as any)

      // Mock existing analyses check
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId, documentIds)

      expect(jobId).toMatch(/^batch_\d+_[a-z0-9]+$/)
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Batch job created',
        expect.objectContaining({
          jobId,
          userId,
          totalDocuments: 3,
        })
      )
    })

    test('should handle documents that do not belong to user', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1', 'doc-2', 'doc-3']
      
      // Mock documents validation - only 2 documents returned
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
          { id: 'doc-2', status: 'uploaded', extracted_text: 'Document 2 text' },
        ],
        error: null,
      } as any)

      await expect(
        batchProcessor.createBatchJob(userId, documentIds)
      ).rejects.toThrow('Some documents were not found or do not belong to the user')
    })

    test('should skip documents without extracted text', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1', 'doc-2', 'doc-3']
      
      // Mock documents validation - mixed documents
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
          { id: 'doc-2', status: 'uploaded', extracted_text: null },
          { id: 'doc-3', status: 'uploaded', extracted_text: 'Document 3 text' },
        ],
        error: null,
      } as any)

      // Mock existing analyses check
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId, documentIds)

      expect(jobId).toBeDefined()
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Batch job created',
        expect.objectContaining({
          totalDocuments: 2, // Only documents with extracted text
        })
      )
    })

    test('should skip already analyzed documents when skipDuplicates is true', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1', 'doc-2', 'doc-3']
      
      // Mock documents validation
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
          { id: 'doc-2', status: 'uploaded', extracted_text: 'Document 2 text' },
          { id: 'doc-3', status: 'uploaded', extracted_text: 'Document 3 text' },
        ],
        error: null,
      } as any)

      // Mock existing analyses - doc-1 already analyzed
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [{ document_id: 'doc-1' }],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId, documentIds, {
        skipDuplicates: true
      })

      expect(jobId).toBeDefined()
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Skipping already analyzed documents',
        { skipped: 1, remaining: 2 }
      )
    })

    test('should throw error when no documents have extracted text', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1', 'doc-2']
      
      // Mock documents validation - no extracted text
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: null },
          { id: 'doc-2', status: 'uploaded', extracted_text: null },
        ],
        error: null,
      } as any)

      await expect(
        batchProcessor.createBatchJob(userId, documentIds)
      ).rejects.toThrow('No documents have extracted text for analysis')
    })

    test('should throw error when all documents already analyzed', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1', 'doc-2']
      
      // Mock documents validation
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
          { id: 'doc-2', status: 'uploaded', extracted_text: 'Document 2 text' },
        ],
        error: null,
      } as any)

      // Mock existing analyses - all documents already analyzed
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { document_id: 'doc-1' },
          { document_id: 'doc-2' }
        ],
        error: null,
      } as any)

      await expect(
        batchProcessor.createBatchJob(userId, documentIds, { skipDuplicates: true })
      ).rejects.toThrow('All documents have already been analyzed')
    })

    test('should handle database errors during document validation', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1']
      
      // Mock database error
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(
        batchProcessor.createBatchJob(userId, documentIds)
      ).rejects.toThrow('Failed to validate documents: Database connection failed')
    })

    test('should apply custom options correctly', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1']
      const customOptions = {
        concurrency: 5,
        retryAttempts: 3,
        timeoutMs: 600000,
        skipDuplicates: false,
        notifyOnComplete: false,
      }
      
      // Mock documents validation
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
        ],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId, documentIds, customOptions)

      expect(jobId).toBeDefined()
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Batch job created',
        expect.objectContaining({
          options: expect.objectContaining(customOptions),
        })
      )
    })
  })

  describe('getBatchJobStatus', () => {
    test('should return job status for existing job', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1']
      
      // Create a job first
      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' }],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId, documentIds)
      const job = await batchProcessor.getBatchJobStatus(jobId, userId)

      expect(job).toBeDefined()
      expect(job!.id).toBe(jobId)
      expect(job!.userId).toBe(userId)
      expect(job!.status).toBe('pending')
    })

    test('should return null for non-existent job', async () => {
      const job = await batchProcessor.getBatchJobStatus('non-existent', 'user-123')
      expect(job).toBeNull()
    })

    test('should return null for job belonging to different user', async () => {
      const userId1 = 'user-123'
      const userId2 = 'user-456'
      const documentIds = ['doc-1']
      
      // Create job for user1
      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' }],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId1, documentIds)
      
      // Try to access with user2
      const job = await batchProcessor.getBatchJobStatus(jobId, userId2)
      expect(job).toBeNull()
    })
  })

  describe('cancelBatchJob', () => {
    test('should cancel pending job successfully', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1']
      
      // Create a job
      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' }],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId, documentIds)
      const cancelled = await batchProcessor.cancelBatchJob(jobId, userId)

      expect(cancelled).toBe(true)
      
      const job = await batchProcessor.getBatchJobStatus(jobId, userId)
      expect(job!.status).toBe('failed')
      expect(job!.error).toBe('Job cancelled by user')
    })

    test('should not cancel completed job', async () => {
      const userId = 'user-123'
      const documentIds = ['doc-1']
      
      // Create and manually complete a job
      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' }],
        error: null,
      } as any)

      const jobId = await batchProcessor.createBatchJob(userId, documentIds)
      
      // Manually set job as completed
      const job = await batchProcessor.getBatchJobStatus(jobId, userId)
      if (job) {
        job.status = 'completed'
      }

      const cancelled = await batchProcessor.cancelBatchJob(jobId, userId)
      expect(cancelled).toBe(false)
    })

    test('should return false for non-existent job', async () => {
      const cancelled = await batchProcessor.cancelBatchJob('non-existent', 'user-123')
      expect(cancelled).toBe(false)
    })
  })

  describe('getUserBatchJobs', () => {
    test('should return user batch jobs', async () => {
      const userId = 'user-123'
      const documentIds1 = ['doc-1']
      const documentIds2 = ['doc-2']
      
      // Create multiple jobs
      mockSupabase.from().select.mockResolvedValue({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
          { id: 'doc-2', status: 'uploaded', extracted_text: 'Document 2 text' },
        ],
        error: null,
      } as any)

      const jobId1 = await batchProcessor.createBatchJob(userId, documentIds1)
      const jobId2 = await batchProcessor.createBatchJob(userId, documentIds2)

      const jobs = await batchProcessor.getUserBatchJobs(userId)

      expect(jobs).toHaveLength(2)
      expect(jobs.map(j => j.id)).toContain(jobId1)
      expect(jobs.map(j => j.id)).toContain(jobId2)
      expect(jobs.every(j => j.userId === userId)).toBe(true)
    })

    test('should return empty array for user with no jobs', async () => {
      const jobs = await batchProcessor.getUserBatchJobs('user-with-no-jobs')
      expect(jobs).toEqual([])
    })

    test('should only return jobs for specified user', async () => {
      const userId1 = 'user-123'
      const userId2 = 'user-456'
      const documentIds = ['doc-1']
      
      // Create jobs for different users
      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' }],
        error: null,
      } as any)

      await batchProcessor.createBatchJob(userId1, documentIds)
      await batchProcessor.createBatchJob(userId2, documentIds)

      const user1Jobs = await batchProcessor.getUserBatchJobs(userId1)
      const user2Jobs = await batchProcessor.getUserBatchJobs(userId2)

      expect(user1Jobs).toHaveLength(1)
      expect(user2Jobs).toHaveLength(1)
      expect(user1Jobs[0].userId).toBe(userId1)
      expect(user2Jobs[0].userId).toBe(userId2)
    })
  })

  describe('edge cases and error handling', () => {
    test('should handle invalid document IDs', async () => {
      const userId = 'user-123'
      const documentIds = ['invalid-id-1', 'invalid-id-2']
      
      // Mock empty response for invalid IDs
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [],
        error: null,
      } as any)

      await expect(
        batchProcessor.createBatchJob(userId, documentIds)
      ).rejects.toThrow('Some documents were not found or do not belong to the user')
    })

    test('should handle empty document IDs array', async () => {
      const userId = 'user-123'
      const documentIds: string[] = []
      
      // Mock empty response
      ;(mockSupabase.from() as any).select.mockResolvedValueOnce({
        data: [],
        error: null,
      } as any)

      await expect(
        batchProcessor.createBatchJob(userId, documentIds)
      ).rejects.toThrow('Some documents were not found or do not belong to the user')
    })

    test('should handle concurrent job creation', async () => {
      const userId = 'user-123'
      const documentIds1 = ['doc-1']
      const documentIds2 = ['doc-2']
      
      // Mock concurrent document validation
      mockSupabase.from().select.mockResolvedValue({
        data: [
          { id: 'doc-1', status: 'uploaded', extracted_text: 'Document 1 text' },
          { id: 'doc-2', status: 'uploaded', extracted_text: 'Document 2 text' },
        ],
        error: null,
      } as any)

      // Create jobs concurrently
      const [jobId1, jobId2] = await Promise.all([
        batchProcessor.createBatchJob(userId, documentIds1),
        batchProcessor.createBatchJob(userId, documentIds2)
      ])

      expect(jobId1).toBeDefined()
      expect(jobId2).toBeDefined()
      expect(jobId1).not.toBe(jobId2)
    })
  })
})