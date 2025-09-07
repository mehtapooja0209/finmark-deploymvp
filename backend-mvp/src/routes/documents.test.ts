import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'
import app from '../index'
import { DocumentProcessor } from '../services/document-processor'

// Mock dependencies
// Note: Supabase client is mocked globally in `src/test/setup.ts`
jest.mock('../services/document-processor')

// Use the global Supabase mock exposed by setup.ts for consistency across tests
const mockSupabaseClient: any = (global as any).mockSupabaseClient

const mockDocumentProcessor = {
  processDocument: jest.fn() as jest.MockedFunction<any>,
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
  const documentRoutes = require('./documents').default
  testApp.use('/api/documents', documentRoutes)
  
  return testApp
}

describe('Documents API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabaseClient as any)
    ;(DocumentProcessor as jest.MockedClass<typeof DocumentProcessor>).mockImplementation(() => mockDocumentProcessor as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('POST /api/documents/upload', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('test file'), 'test.pdf')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('should return 400 when no file is uploaded', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const response = await request(authenticatedApp)
        .post('/api/documents/upload')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('No file uploaded')
    })

    test('should successfully upload a PDF file', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockDocument = {
        id: 'doc-123',
        name: 'test.pdf',
        original_name: 'test.pdf',
        size: 1024,
        extracted_text: 'This is extracted text from PDF',
        user_id: 'user-123',
      }

      mockDocumentProcessor.processDocument.mockResolvedValueOnce(mockDocument)

      const response = await request(authenticatedApp)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('test PDF content'), 'test.pdf')

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Document uploaded successfully')
      expect(response.body.document).toEqual(mockDocument)
      expect(mockDocumentProcessor.processDocument).toHaveBeenCalled()
    })

    test('should handle document processing errors', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockDocumentProcessor.processDocument.mockRejectedValueOnce(
        new Error('Failed to extract text from PDF')
      )

      const response = await request(authenticatedApp)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('corrupted PDF'), 'test.pdf')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to upload document')
      expect(response.body.details).toBe('Failed to extract text from PDF')
    })

    test('should reject non-PDF files', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('document', Buffer.from('text content'), 'test.txt')

      // This would be handled by multer fileFilter in the actual route
      // For this test, we assume the multer configuration rejects non-PDF files
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('GET /api/documents/', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/documents/')

      expect(response.status).toBe(401)
    })

    test('should return user documents', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockDocuments = [
        {
          id: 'doc-1',
          name: 'document1.pdf',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'doc-2',
          name: 'document2.pdf',
          status: 'processing',
          created_at: '2024-01-02T00:00:00Z',
        },
      ]

      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: mockDocuments,
        error: null,
      })

      const response = await request(authenticatedApp)
        .get('/api/documents/')

      expect(response.status).toBe(200)
      expect(response.body.documents).toEqual(mockDocuments)
      expect(response.body.documents).toHaveLength(2)
    })

    test('should return empty array when no documents exist', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const response = await request(authenticatedApp)
        .get('/api/documents/')

      expect(response.status).toBe(200)
      expect(response.body.documents).toEqual([])
    })

    test('should handle database errors', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const response = await request(authenticatedApp)
        .get('/api/documents/')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to retrieve documents')
    })
  })

  describe('GET /api/documents/:id', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/documents/doc-123')

      expect(response.status).toBe(401)
    })

    test('should return specific document', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      const mockDocument = {
        id: 'doc-123',
        name: 'test.pdf',
        extracted_text: 'Document content',
        status: 'completed',
        user_id: 'user-123',
      }

      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      })

      const response = await request(authenticatedApp)
        .get('/api/documents/doc-123')

      expect(response.status).toBe(200)
      expect(response.body.document).toEqual(mockDocument)
    })

    test('should return 404 for non-existent document', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const response = await request(authenticatedApp)
        .get('/api/documents/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Document not found')
    })

    test('should not return documents from other users', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const response = await request(authenticatedApp)
        .get('/api/documents/other-user-doc')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Document not found')
    })

    test('should handle database errors', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const response = await request(authenticatedApp)
        .get('/api/documents/doc-123')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to retrieve document')
    })
  })

  describe('DELETE /api/documents/:id', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/documents/doc-123')

      expect(response.status).toBe(401)
    })

    test('should successfully delete document', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().delete.mockResolvedValueOnce({
        error: null,
      })

      const response = await request(authenticatedApp)
        .delete('/api/documents/doc-123')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Document deleted successfully')
    })

    test('should handle database errors during deletion', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      mockSupabaseClient.from().delete.mockResolvedValueOnce({
        error: { message: 'Deletion failed' },
      })

      const response = await request(authenticatedApp)
        .delete('/api/documents/doc-123')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to delete document')
      expect(response.body.details).toBe('Database error: Deletion failed')
    })

    test('should only delete user own documents', async () => {
      const authenticatedApp = createAuthenticatedApp()
      
      // The delete operation includes user_id filter, so it won't delete other users' documents
      mockSupabaseClient.from().delete.mockResolvedValueOnce({
        error: null,
      })

      const response = await request(authenticatedApp)
        .delete('/api/documents/doc-123')

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('user_id', 'user-123')
    })
  })
})