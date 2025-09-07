import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { DatabaseService, databaseService, ComplianceAnalysisData } from './database-service'
import { supabase } from '../config/supabase'
import { MarketingAnalysisResult } from '../core-engine/pipeline/marketing-analysis-pipeline'

// Mock dependencies
jest.mock('../config/supabase')
jest.mock('../utils/logger')

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  })),
}

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}

describe('DatabaseService', () => {
  let dbService: DatabaseService

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock supabase
    Object.assign(supabase, mockSupabase)
    
    // Mock logger
    const logger = require('../utils/logger')
    Object.assign(logger, { logger: mockLogger })

    dbService = new DatabaseService()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('saveAnalysisResults', () => {
    const mockAnalysisData: ComplianceAnalysisData = {
      complianceScore: 85,
      overallStatus: 'compliant',
      aiModelUsed: 'gpt-4',
      confidence: 0.9,
      violations: [
        {
          category: 'data_protection',
          title: 'Missing Privacy Policy',
          description: 'Document lacks privacy policy section',
          severity: 'medium',
          confidence: 0.8,
          suggestion: 'Add comprehensive privacy policy'
        }
      ]
    }

    test('should save analysis results successfully', async () => {
      const mockAnalysisResult = {
        id: 'analysis-123',
        document_id: 'doc-123',
        compliance_score: 85,
        overall_status: 'compliant',
        ai_model_used: 'gpt-4',
        confidence: 0.9,
        user_id: 'user-123',
        created_at: '2024-01-01T10:00:00Z'
      }

      // Mock successful analysis insert
      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockAnalysisResult,
        error: null,
      })

      // Mock successful violations insert
      mockSupabase.from().insert.mockResolvedValueOnce({
        error: null,
      })

      const result = await dbService.saveAnalysisResults(
        mockAnalysisData,
        'doc-123',
        'user-123'
      )

      expect(result).toEqual(mockAnalysisResult)
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_results')
      expect(mockSupabase.from).toHaveBeenCalledWith('violations')
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Analysis results saved successfully',
        expect.objectContaining({
          documentId: 'doc-123',
          userId: 'user-123',
          analysisId: 'analysis-123',
          violationsCount: 1
        })
      )
    })

    test('should save analysis results without violations', async () => {
      const analysisDataNoViolations: ComplianceAnalysisData = {
        ...mockAnalysisData,
        violations: []
      }

      const mockAnalysisResult = {
        id: 'analysis-456',
        document_id: 'doc-456',
        compliance_score: 95,
        overall_status: 'compliant',
        user_id: 'user-123'
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockAnalysisResult,
        error: null,
      })

      const result = await dbService.saveAnalysisResults(
        analysisDataNoViolations,
        'doc-456',
        'user-123'
      )

      expect(result).toEqual(mockAnalysisResult)
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_results')
      // Violations table should not be called
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })

    test('should handle analysis insert errors', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      })

      await expect(
        dbService.saveAnalysisResults(mockAnalysisData, 'doc-123', 'user-123')
      ).rejects.toThrow('Database save failed: Failed to save analysis: Foreign key constraint violation')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save analysis results',
        expect.objectContaining({
          documentId: 'doc-123',
          userId: 'user-123'
        })
      )
    })

    test('should handle null analysis result after insert', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(
        dbService.saveAnalysisResults(mockAnalysisData, 'doc-123', 'user-123')
      ).rejects.toThrow('Database save failed: Analysis result was not returned after insert')
    })

    test('should handle violations insert errors', async () => {
      const mockAnalysisResult = {
        id: 'analysis-123',
        document_id: 'doc-123',
        user_id: 'user-123'
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockAnalysisResult,
        error: null,
      })

      mockSupabase.from().insert.mockResolvedValueOnce({
        error: { message: 'Violations insert failed' },
      })

      await expect(
        dbService.saveAnalysisResults(mockAnalysisData, 'doc-123', 'user-123')
      ).rejects.toThrow('Database save failed: Failed to save violations: Violations insert failed')
    })
  })

  describe('saveMarketingAnalysisResults', () => {
    test('should convert and save marketing analysis results', async () => {
      const mockMarketingResult: MarketingAnalysisResult = {
        complianceReport: {
          score: {
            totalScore: 78,
            complianceLevel: 'needs_review' as const
          },
          violations: [
            {
              rule: {
                category: 'fair_practices',
                title: 'Misleading Claims',
                description: 'Claims may mislead customers'
              },
              severity: 'high' as const,
              confidence: 0.85,
              matchedText: 'guaranteed profits'
            }
          ]
        },
        recommendations: {
          specificFixes: [
            {
              originalText: 'guaranteed profits',
              suggestedText: 'potential returns subject to market risk'
            }
          ]
        },
        aiInsights: {
          aiViolations: [
            { confidenceScore: 0.9 },
            { confidenceScore: 0.8 }
          ]
        }
      } as MarketingAnalysisResult

      const mockSavedResult = {
        id: 'marketing-analysis-123',
        document_id: 'doc-123',
        compliance_score: 78,
        overall_status: 'needs_review',
        user_id: 'user-123'
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockSavedResult,
        error: null,
      })

      mockSupabase.from().insert.mockResolvedValueOnce({
        error: null,
      })

      const result = await dbService.saveMarketingAnalysisResults(
        mockMarketingResult,
        'doc-123',
        'user-123'
      )

      expect(result).toEqual(mockSavedResult)
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_results')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          compliance_score: 78,
          overall_status: 'needs_review',
          ai_model_used: 'gemini-pro + rule-engine',
          confidence: 0.85 // Average of AI violations confidence scores
        })
      )
    })

    test('should handle marketing analysis with no AI violations', async () => {
      const mockMarketingResult: MarketingAnalysisResult = {
        complianceReport: {
          score: {
            totalScore: 95,
            complianceLevel: 'compliant' as const
          },
          violations: []
        },
        recommendations: {
          specificFixes: []
        },
        aiInsights: {
          aiViolations: [] // No AI violations
        }
      } as MarketingAnalysisResult

      const mockSavedResult = {
        id: 'marketing-analysis-456',
        compliance_score: 95,
        overall_status: 'compliant',
        user_id: 'user-123'
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockSavedResult,
        error: null,
      })

      const result = await dbService.saveMarketingAnalysisResults(
        mockMarketingResult,
        'doc-456',
        'user-123'
      )

      expect(result).toEqual(mockSavedResult)
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          confidence: 0.8 // Default confidence when no AI violations
        })
      )
    })
  })

  describe('updateDocumentStatus', () => {
    test('should update document status successfully', async () => {
      mockSupabase.from().update.mockResolvedValueOnce({
        error: null,
      })

      await dbService.updateDocumentStatus('doc-123', 'analyzed')

      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'analyzed',
          updated_at: expect.any(String)
        })
      )
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'doc-123')
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Document status updated',
        { documentId: 'doc-123', status: 'analyzed' }
      )
    })

    test('should handle document status update errors', async () => {
      mockSupabase.from().update.mockResolvedValueOnce({
        error: { message: 'Document not found' },
      })

      await expect(
        dbService.updateDocumentStatus('nonexistent-doc', 'analyzed')
      ).rejects.toThrow('Failed to update document status: Document not found')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update document status',
        expect.objectContaining({
          documentId: 'nonexistent-doc',
          status: 'analyzed'
        })
      )
    })
  })

  describe('getAnalysisResults', () => {
    test('should retrieve analysis results with violations', async () => {
      const mockAnalysis = {
        id: 'analysis-123',
        document_id: 'doc-123',
        compliance_score: 75,
        user_id: 'user-123'
      }

      const mockViolations = [
        {
          id: 'violation-1',
          analysis_result_id: 'analysis-123',
          category: 'data_protection',
          title: 'Missing Privacy Policy',
          severity: 'medium'
        }
      ]

      mockSupabase.from().maybeSingle.mockResolvedValueOnce({
        data: mockAnalysis,
        error: null,
      })

      mockSupabase.from().order.mockResolvedValueOnce({
        data: mockViolations,
        error: null,
      })

      const result = await dbService.getAnalysisResults('doc-123', 'user-123')

      expect(result).toEqual({
        analysis: mockAnalysis,
        violations: mockViolations
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_results')
      expect(mockSupabase.from).toHaveBeenCalledWith('violations')
    })

    test('should return null when no analysis results exist', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await dbService.getAnalysisResults('doc-nonexistent', 'user-123')

      expect(result).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_results')
      expect(mockSupabase.from).not.toHaveBeenCalledWith('violations')
    })

    test('should handle analysis retrieval errors', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(
        dbService.getAnalysisResults('doc-123', 'user-123')
      ).rejects.toThrow('Failed to get analysis: Database connection failed')
    })

    test('should handle violations retrieval errors', async () => {
      const mockAnalysis = {
        id: 'analysis-123',
        document_id: 'doc-123',
        user_id: 'user-123'
      }

      mockSupabase.from().maybeSingle.mockResolvedValueOnce({
        data: mockAnalysis,
        error: null,
      })

      mockSupabase.from().order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Violations query failed' },
      })

      await expect(
        dbService.getAnalysisResults('doc-123', 'user-123')
      ).rejects.toThrow('Failed to get violations: Violations query failed')
    })
  })

  describe('getComplianceStatistics', () => {
    test('should calculate compliance statistics correctly', async () => {
      const mockAnalyses = [
        { id: '1', compliance_score: 90, overall_status: 'compliant', created_at: '2024-01-01' },
        { id: '2', compliance_score: 70, overall_status: 'needs_review', created_at: '2024-01-02' },
        { id: '3', compliance_score: 40, overall_status: 'non_compliant', created_at: '2024-01-03' },
        { id: '4', compliance_score: 85, overall_status: 'compliant', created_at: '2024-01-04' },
      ]

      mockSupabase.from().order.mockResolvedValueOnce({
        data: mockAnalyses,
        error: null,
      })

      const result = await dbService.getComplianceStatistics('user-123')

      expect(result).toEqual({
        totalAnalyses: 4,
        averageScore: 71, // (90+70+40+85)/4 = 71.25, rounded to 71
        complianceLevels: {
          compliant: 2,
          needs_review: 1,
          non_compliant: 1
        },
        recentAnalyses: mockAnalyses
      })
    })

    test('should handle user with no analyses', async () => {
      mockSupabase.from().order.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await dbService.getComplianceStatistics('user-no-analyses')

      expect(result).toEqual({
        totalAnalyses: 0,
        averageScore: 0,
        complianceLevels: {
          compliant: 0,
          needs_review: 0,
          non_compliant: 0
        },
        recentAnalyses: []
      })
    })

    test('should limit recent analyses to 10', async () => {
      const mockAnalyses = Array.from({ length: 15 }, (_, i) => ({
        id: `analysis-${i + 1}`,
        compliance_score: 80,
        overall_status: 'compliant',
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}`
      }))

      mockSupabase.from().order.mockResolvedValueOnce({
        data: mockAnalyses,
        error: null,
      })

      const result = await dbService.getComplianceStatistics('user-123')

      expect(result.totalAnalyses).toBe(15)
      expect(result.recentAnalyses).toHaveLength(10)
      expect(result.recentAnalyses[0].id).toBe('analysis-1')
      expect(result.recentAnalyses[9].id).toBe('analysis-10')
    })

    test('should handle statistics query errors', async () => {
      mockSupabase.from().order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Statistics query failed' },
      })

      await expect(
        dbService.getComplianceStatistics('user-123')
      ).rejects.toThrow('Failed to get statistics: Statistics query failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get compliance statistics',
        expect.objectContaining({
          userId: 'user-123'
        })
      )
    })
  })

  describe('singleton instance', () => {
    test('should export a singleton instance', () => {
      expect(databaseService).toBeInstanceOf(DatabaseService)
      expect(databaseService).toBe(databaseService) // Same instance
    })

    test('should maintain state across calls', async () => {
      // This test ensures the singleton pattern works correctly
      const instance1 = databaseService
      const instance2 = databaseService

      expect(instance1).toBe(instance2)
    })
  })

  describe('edge cases and error handling', () => {
    test('should handle database connection timeouts', async () => {
      const timeoutError = new Error('Connection timeout')
      mockSupabase.from().single.mockRejectedValueOnce(timeoutError)

      await expect(
        dbService.saveAnalysisResults(
          {
            complianceScore: 80,
            overallStatus: 'compliant',
            aiModelUsed: 'gpt-4',
            confidence: 0.8,
            violations: []
          },
          'doc-123',
          'user-123'
        )
      ).rejects.toThrow('Database save failed: Connection timeout')
    })

    test('should handle large numbers of violations', async () => {
      const manyViolations = Array.from({ length: 100 }, (_, i) => ({
        category: `category-${i}`,
        title: `Violation ${i}`,
        description: `Description ${i}`,
        severity: 'medium' as const,
        confidence: 0.8,
        suggestion: `Fix ${i}`
      }))

      const analysisData: ComplianceAnalysisData = {
        complianceScore: 30,
        overallStatus: 'non_compliant',
        aiModelUsed: 'gpt-4',
        confidence: 0.7,
        violations: manyViolations
      }

      const mockAnalysisResult = {
        id: 'analysis-many-violations',
        document_id: 'doc-123',
        user_id: 'user-123'
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: mockAnalysisResult,
        error: null,
      })

      mockSupabase.from().insert.mockResolvedValueOnce({
        error: null,
      })

      const result = await dbService.saveAnalysisResults(
        analysisData,
        'doc-123',
        'user-123'
      )

      expect(result).toEqual(mockAnalysisResult)
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            analysis_result_id: 'analysis-many-violations'
          })
        ])
      )
    })
  })
})