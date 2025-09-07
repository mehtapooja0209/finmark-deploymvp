import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'
import { DocumentProcessor } from '../../services/document-processor'
import { AIService } from '../../services/ai-service'

// Mock dependencies for integration testing
// Note: Supabase client is mocked globally in `src/test/setup.ts`
jest.mock('../../services/document-processor')
jest.mock('../../services/ai-service')

// Use the global Supabase mock exposed by setup.ts for consistency across tests
const mockSupabaseClient: any = (global as any).mockSupabaseClient

const mockDocumentProcessor = {
  processDocument: jest.fn() as jest.MockedFunction<any>,
}

const mockAIService = {
  analyzeCompliance: jest.fn() as jest.MockedFunction<any>,
}

// Mock authentication middleware for integration tests
const mockUser = {
  id: 'user-integration-test',
  email: 'integration@test.com',
}

// Helper to create test app with authentication bypass
const createTestApp = () => {
  const express = require('express')
  const testApp = express()
  testApp.use(express.json())

  // Bypass authentication for integration tests
  testApp.use((req: any, res: any, next: any) => {
    req.user = mockUser
    next()
  })

  // Mount routes
  const documentRoutes = require('../../routes/documents').default
  const analysisRoutes = require('../../routes/analysis').default
  
  testApp.use('/api/documents', documentRoutes)
  testApp.use('/api/analysis', analysisRoutes)

  return testApp
}

describe('Document Analysis Integration Tests', () => {
  let testApp: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mocks
    ;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabaseClient as any)
    ;(DocumentProcessor as jest.MockedClass<typeof DocumentProcessor>).mockImplementation(() => mockDocumentProcessor as any)
    ;(AIService as jest.MockedClass<typeof AIService>).mockImplementation(() => mockAIService as any)

    testApp = createTestApp()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('End-to-End Document Upload and Analysis', () => {
    test('should complete full workflow: upload -> analyze -> get results', async () => {
      // Step 1: Upload document
      const mockDocument = {
        id: 'doc-integration-123',
        name: 'test-compliance-doc.pdf',
        original_name: 'test-compliance-doc.pdf',
        type: 'application/pdf',
        size: 2048000,
        url: 'https://storage.example.com/doc-123.pdf',
        status: 'uploaded',
        extracted_text: 'This is a test financial document with various compliance requirements.',
        user_id: 'user-integration-test',
        created_at: '2024-01-01T10:00:00Z',
      }

      ;(mockDocumentProcessor.processDocument as jest.MockedFunction<any>).mockResolvedValueOnce(mockDocument)

      const uploadResponse = await request(testApp)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('mock PDF content'), 'test-compliance-doc.pdf')

      expect(uploadResponse.status).toBe(201)
      expect(uploadResponse.body.message).toBe('Document uploaded successfully')
      expect(uploadResponse.body.document.id).toBe('doc-integration-123')

      // Step 2: Get document to verify upload
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      })

      const getDocumentResponse = await request(testApp)
        .get('/api/documents/doc-integration-123')

      expect(getDocumentResponse.status).toBe(200)
      expect(getDocumentResponse.body.document.extracted_text).toBe(mockDocument.extracted_text)

      // Step 3: Analyze document
      const mockAnalysisResult = {
        complianceScore: 78,
        overallStatus: 'needs_review',
        violations: [
          {
            category: 'data_protection',
            title: 'Missing Privacy Policy',
            description: 'Document lacks comprehensive privacy policy',
            severity: 'medium',
            confidence: 0.85,
            suggestion: 'Add detailed privacy policy section'
          },
          {
            category: 'risk_management',
            title: 'Insufficient Risk Disclosure',
            description: 'Risk disclosures are not comprehensive enough',
            severity: 'high',
            confidence: 0.92,
            suggestion: 'Include detailed risk assessment and mitigation strategies'
          }
        ],
        confidence: 0.88
      }

      // Mock document retrieval for analysis
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      })

      // Mock analysis status update
      mockSupabaseClient.from().update.mockResolvedValueOnce({ error: null })

      ;(mockAIService.analyzeCompliance as jest.MockedFunction<any>).mockResolvedValueOnce(mockAnalysisResult)

      const analyzeResponse = await request(testApp)
        .post('/api/analysis/documents/doc-integration-123/analyze')
        .send()

      expect(analyzeResponse.status).toBe(200)
      expect(analyzeResponse.body.message).toBe('Document analyzed successfully')
      expect(analyzeResponse.body.analysis.complianceScore).toBe(78)
      expect(analyzeResponse.body.analysis.violations).toHaveLength(2)

      // Step 4: Get analysis results
      const mockAnalysisResults = [
        {
          id: 'analysis-123',
          document_id: 'doc-integration-123',
          compliance_score: 78,
          overall_status: 'needs_review',
          violations: [
            {
              id: 'violation-1',
              category: 'data_protection',
              title: 'Missing Privacy Policy',
              severity: 'medium'
            },
            {
              id: 'violation-2',
              category: 'risk_management',
              title: 'Insufficient Risk Disclosure',
              severity: 'high'
            }
          ],
          created_at: '2024-01-01T10:05:00Z'
        }
      ]

      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: mockAnalysisResults,
        error: null,
      })

      const resultsResponse = await request(testApp)
        .get('/api/analysis/documents/doc-integration-123/results')

      expect(resultsResponse.status).toBe(200)
      expect(resultsResponse.body.analysisResults).toHaveLength(1)
      expect(resultsResponse.body.analysisResults[0].compliance_score).toBe(78)
      expect(resultsResponse.body.analysisResults[0].violations).toHaveLength(2)

      // Verify all services were called correctly
      expect(mockDocumentProcessor.processDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          originalname: 'test-compliance-doc.pdf',
        }),
        'user-integration-test'
      )
      
      expect(mockAIService.analyzeCompliance).toHaveBeenCalledWith(
        mockDocument.extracted_text,
        'doc-integration-123',
        'user-integration-test'
      )
    })

    test('should handle document upload failure gracefully', async () => {
      ;(mockDocumentProcessor.processDocument as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('Failed to extract text from corrupted PDF')
      )

      const response = await request(testApp)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('corrupted PDF'), 'corrupted.pdf')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to upload document')
      expect(response.body.details).toBe('Failed to extract text from corrupted PDF')
    })

    test('should handle analysis failure and rollback document status', async () => {
      const mockDocument = {
        id: 'doc-fail-123',
        extracted_text: 'Test document text',
        user_id: 'user-integration-test',
      }

      // Mock successful document retrieval
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      })

      // Mock status update calls
      mockSupabaseClient.from().update.mockResolvedValue({ error: null })

      // Mock AI service failure
      ;(mockAIService.analyzeCompliance as jest.MockedFunction<any>).mockRejectedValueOnce(
        new Error('AI service temporarily unavailable')
      )

      const response = await request(testApp)
        .post('/api/analysis/documents/doc-fail-123/analyze')
        .send()

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to analyze document')
      expect(response.body.details).toBe('AI service temporarily unavailable')

      // Verify document status was updated to error
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({ status: 'error' })
    })

    test('should prevent analysis of documents without extracted text', async () => {
      const mockDocumentWithoutText = {
        id: 'doc-no-text-123',
        name: 'image-doc.jpg',
        extracted_text: null,
        user_id: 'user-integration-test',
      }

      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockDocumentWithoutText,
        error: null,
      })

      const response = await request(testApp)
        .post('/api/analysis/documents/doc-no-text-123/analyze')
        .send()

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Document has no extracted text to analyze')
      expect(mockAIService.analyzeCompliance).not.toHaveBeenCalled()
    })

    test('should prevent unauthorized access to other users documents', async () => {
      // Mock document that belongs to different user
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const response = await request(testApp)
        .post('/api/analysis/documents/other-user-doc-123/analyze')
        .send()

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Document not found')
    })

    test('should maintain data consistency across multiple operations', async () => {
      const documentId = 'doc-consistency-123'
      const userId = 'user-integration-test'

      // Mock multiple documents for list operation
      const mockDocuments = [
        {
          id: documentId,
          name: 'doc1.pdf',
          status: 'analyzed',
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 'doc-consistency-456',
          name: 'doc2.pdf',
          status: 'uploaded',
          created_at: '2024-01-01T11:00:00Z'
        }
      ]

      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: mockDocuments,
        error: null,
      })

      // Get all documents
      const documentsResponse = await request(testApp)
        .get('/api/documents/')

      expect(documentsResponse.status).toBe(200)
      expect(documentsResponse.body.documents).toHaveLength(2)

      // Get specific document
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockDocuments[0],
        error: null,
      })

      const singleDocResponse = await request(testApp)
        .get(`/api/documents/${documentId}`)

      expect(singleDocResponse.status).toBe(200)
      expect(singleDocResponse.body.document.id).toBe(documentId)

      // Get all analysis results
      const mockAnalysisResults = [
        {
          id: 'analysis-1',
          document_id: documentId,
          compliance_score: 85,
          documents: { name: 'doc1.pdf' },
          violations: []
        }
      ]

      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: mockAnalysisResults,
        error: null,
      })

      const allResultsResponse = await request(testApp)
        .get('/api/analysis/results')

      expect(allResultsResponse.status).toBe(200)
      expect(allResultsResponse.body.analysisResults).toHaveLength(1)
      expect(allResultsResponse.body.analysisResults[0].document_id).toBe(documentId)

      // Verify user isolation - all operations should filter by user_id
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('analysis_results')
    })
  })

  describe('Error Recovery and Resilience', () => {
    test('should handle database connection failures gracefully', async () => {
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection timeout' },
      })

      const response = await request(testApp)
        .get('/api/documents/doc-123')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to retrieve document')
    })

    test('should handle concurrent analysis requests for same document', async () => {
      const documentId = 'doc-concurrent-123'
      const mockDocument = {
        id: documentId,
        extracted_text: 'Test document for concurrent analysis',
        user_id: 'user-integration-test',
      }

      // Mock document retrieval for both requests
      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockDocument,
        error: null,
      })

      // Mock status updates
      mockSupabaseClient.from().update.mockResolvedValue({ error: null })

      // Mock AI service with delay for first request
      mockAIService.analyzeCompliance
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ complianceScore: 80, violations: [] }), 100)
        ))
        .mockResolvedValueOnce({ complianceScore: 85, violations: [] })

      // Send concurrent analysis requests
      const [response1, response2] = await Promise.all([
        request(testApp)
          .post(`/api/analysis/documents/${documentId}/analyze`)
          .send(),
        request(testApp)
          .post(`/api/analysis/documents/${documentId}/analyze`)
          .send()
      ])

      // Both should succeed (implementation should handle concurrency)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(mockAIService.analyzeCompliance).toHaveBeenCalledTimes(2)
    })
  })
})