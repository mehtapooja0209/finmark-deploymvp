import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AIService, ComplianceAnalysis } from './ai-service'
import { marketingPipeline } from '../core-engine/pipeline/marketing-analysis-pipeline'
import { databaseService } from './database-service'

// Mock dependencies
jest.mock('openai')
jest.mock('../utils/logger')
jest.mock('../utils/cache')
jest.mock('../middleware/validation')
jest.mock('../core-engine/pipeline/marketing-analysis-pipeline')
jest.mock('./database-service')

const mockMarketingPipeline = {
  analyzeMarketingCompliance: jest.fn() as jest.MockedFunction<any>,
  quickComplianceCheck: jest.fn() as jest.MockedFunction<any>,
  validateSetup: jest.fn() as jest.MockedFunction<any>,
}

const mockDatabaseService = {
  saveAnalysisResults: jest.fn() as jest.MockedFunction<any>,
  updateDocumentStatus: jest.fn() as jest.MockedFunction<any>,
}

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn() as jest.MockedFunction<any>,
    },
  },
}

// Mock cache functions
const mockCache = {
  getCachedAnalysisResult: jest.fn() as jest.MockedFunction<any>,
  cacheAnalysisResult: jest.fn() as jest.MockedFunction<any>,
  hashText: jest.fn() as jest.MockedFunction<any>,
}

// Mock validation functions
const mockValidation = {
  analyzeTextContent: jest.fn() as jest.MockedFunction<any>,
}

describe('AIService', () => {
  let aiService: AIService

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock marketing pipeline
    Object.assign(marketingPipeline, mockMarketingPipeline)
    
    // Mock database service
    Object.assign(databaseService, mockDatabaseService)
    
    // Mock OpenAI
    const OpenAI = require('openai')
    OpenAI.mockImplementation(() => mockOpenAI)
    
    // Mock cache functions
    const cache = require('../utils/cache')
    Object.assign(cache, mockCache)
    
    // Mock validation functions
    const validation = require('../middleware/validation')
    Object.assign(validation, mockValidation)
    
    aiService = new AIService()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('analyzeCompliance', () => {
    test('should use marketing pipeline for compliance analysis', async () => {
      const mockMarketingResult = {
        complianceReport: {
          score: {
            totalScore: 85,
            complianceLevel: 'compliant' as const,
          },
          violations: [
            {
              rule: {
                category: 'disclosure',
                title: 'Missing Risk Disclosure',
                description: 'Risk disclosure required'
              },
              severity: 'medium' as const,
              confidence: 0.8,
              matchedText: 'guaranteed returns'
            }
          ]
        },
        recommendations: {
          specificFixes: [
            {
              originalText: 'guaranteed returns',
              suggestedText: 'potential returns subject to market risk'
            }
          ]
        },
        aiInsights: {
          aiViolations: [
            {
              confidenceScore: 0.9
            }
          ]
        }
      }

      mockMarketingPipeline.analyzeMarketingCompliance.mockResolvedValueOnce(mockMarketingResult)

      const result = await aiService.analyzeCompliance(
        'This is a test marketing document with guaranteed returns',
        'doc-123',
        'user-123'
      )

      expect(result.complianceScore).toBe(85)
      expect(result.overallStatus).toBe('compliant')
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].category).toBe('disclosure')
      expect(mockMarketingPipeline.analyzeMarketingCompliance).toHaveBeenCalledWith(
        'This is a test marketing document with guaranteed returns',
        'user-123',
        'doc-123',
        'general_marketing'
      )
    })

    test('should fallback to legacy analysis when marketing pipeline fails', async () => {
      mockMarketingPipeline.analyzeMarketingCompliance.mockRejectedValueOnce(
        new Error('Marketing pipeline unavailable')
      )

      // Mock legacy analysis dependencies
      mockValidation.analyzeTextContent.mockReturnValueOnce({
        isValid: true,
        warnings: [],
        metrics: {}
      })
      mockCache.getCachedAnalysisResult.mockResolvedValueOnce(null)
      mockCache.hashText.mockReturnValueOnce('text-hash-123')
      
      const mockLegacyAnalysis = {
        complianceScore: 75,
        overallStatus: 'needs_review',
        violations: [
          {
            category: 'data_protection',
            title: 'Privacy Policy Missing',
            description: 'Document lacks privacy policy',
            severity: 'medium',
            confidence: 0.7,
            suggestion: 'Add comprehensive privacy policy'
          }
        ],
        confidence: 0.75
      }

      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockLegacyAnalysis)
            }
          }
        ]
      })

      mockDatabaseService.saveAnalysisResults.mockResolvedValueOnce(true)
      mockDatabaseService.updateDocumentStatus.mockResolvedValueOnce(true)
      mockCache.cacheAnalysisResult.mockResolvedValueOnce(true)

      const result = await aiService.analyzeCompliance(
        'This is a test document',
        'doc-123',
        'user-123'
      )

      expect(result.complianceScore).toBe(75)
      expect(result.overallStatus).toBe('needs_review')
      expect(result.violations).toHaveLength(1)
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled()
    })

    test('should return cached result when available', async () => {
      mockMarketingPipeline.analyzeMarketingCompliance.mockRejectedValueOnce(
        new Error('Marketing pipeline unavailable')
      )

      const cachedResult: ComplianceAnalysis = {
        complianceScore: 90,
        overallStatus: 'compliant',
        violations: [],
        confidence: 0.9
      }

      mockValidation.analyzeTextContent.mockReturnValueOnce({
        isValid: true,
        warnings: [],
        metrics: {}
      })
      mockCache.getCachedAnalysisResult.mockResolvedValueOnce(cachedResult)
      mockCache.hashText.mockReturnValueOnce('text-hash-123')

      const result = await aiService.analyzeCompliance(
        'This is a cached document',
        'doc-123',
        'user-123'
      )

      expect(result).toEqual(cachedResult)
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled()
    })

    test('should handle OpenAI API errors gracefully', async () => {
      mockMarketingPipeline.analyzeMarketingCompliance.mockRejectedValueOnce(
        new Error('Marketing pipeline unavailable')
      )

      mockValidation.analyzeTextContent.mockReturnValueOnce({
        isValid: true,
        warnings: [],
        metrics: {}
      })
      mockCache.getCachedAnalysisResult.mockResolvedValueOnce(null)
      mockCache.hashText.mockReturnValueOnce('text-hash-123')

      mockOpenAI.chat.completions.create.mockRejectedValueOnce(
        new Error('OpenAI API rate limit exceeded')
      )

      await expect(
        aiService.analyzeCompliance('Test document', 'doc-123', 'user-123')
      ).rejects.toThrow('Failed to analyze document compliance')
    })

    test('should handle invalid JSON response from OpenAI', async () => {
      mockMarketingPipeline.analyzeMarketingCompliance.mockRejectedValueOnce(
        new Error('Marketing pipeline unavailable')
      )

      mockValidation.analyzeTextContent.mockReturnValueOnce({
        isValid: true,
        warnings: [],
        metrics: {}
      })
      mockCache.getCachedAnalysisResult.mockResolvedValueOnce(null)
      mockCache.hashText.mockReturnValueOnce('text-hash-123')

      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'Invalid JSON response'
            }
          }
        ]
      })

      await expect(
        aiService.analyzeCompliance('Test document', 'doc-123', 'user-123')
      ).rejects.toThrow('Failed to analyze document compliance')
    })
  })

  describe('analyzeMarketingCompliance', () => {
    test('should call marketing pipeline directly', async () => {
      const mockResult = {
        complianceReport: {
          score: { totalScore: 88 },
          violations: []
        },
        recommendations: { specificFixes: [] },
        aiInsights: { aiViolations: [] }
      }

      mockMarketingPipeline.analyzeMarketingCompliance.mockResolvedValueOnce(mockResult)

      const result = await aiService.analyzeMarketingCompliance(
        'Marketing text',
        'doc-123',
        'user-123',
        'fintech_marketing'
      )

      expect(result).toEqual(mockResult)
      expect(mockMarketingPipeline.analyzeMarketingCompliance).toHaveBeenCalledWith(
        'Marketing text',
        'user-123',
        'doc-123',
        'fintech_marketing'
      )
    })
  })

  describe('quickMarketingCheck', () => {
    test('should perform quick compliance check', async () => {
      const mockQuickResult = {
        score: 82,
        issues: ['Minor disclosure issue'],
        recommendations: ['Add risk disclaimer']
      }

      mockMarketingPipeline.quickComplianceCheck.mockResolvedValueOnce(mockQuickResult)

      const result = await aiService.quickMarketingCheck(
        'Quick test text',
        'user-123',
        'social_media'
      )

      expect(result).toEqual(mockQuickResult)
      expect(mockMarketingPipeline.quickComplianceCheck).toHaveBeenCalledWith(
        'Quick test text',
        'user-123',
        'social_media'
      )
    })
  })

  describe('validateMarketingEngine', () => {
    test('should validate marketing engine successfully', async () => {
      const mockValidation = {
        isReady: true,
        issues: []
      }

      mockMarketingPipeline.validateSetup.mockResolvedValueOnce(mockValidation)

      const result = await aiService.validateMarketingEngine()

      expect(result).toEqual(mockValidation)
      expect(mockMarketingPipeline.validateSetup).toHaveBeenCalled()
    })

    test('should handle marketing engine validation errors', async () => {
      mockMarketingPipeline.validateSetup.mockRejectedValueOnce(
        new Error('Validation service unavailable')
      )

      const result = await aiService.validateMarketingEngine()

      expect(result.isReady).toBe(false)
      expect(result.issues).toContain('Marketing engine validation failed: Validation service unavailable')
    })
  })

  describe('convertToLegacyFormat', () => {
    test('should convert marketing result to legacy format correctly', async () => {
      const mockMarketingResult = {
        complianceReport: {
          score: {
            totalScore: 78,
            complianceLevel: 'needs_review' as const,
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
              matchedText: 'zero risk investment'
            }
          ]
        },
        recommendations: {
          specificFixes: [
            {
              originalText: 'zero risk investment',
              suggestedText: 'low risk investment subject to market conditions'
            }
          ]
        },
        aiInsights: {
          aiViolations: [
            { confidenceScore: 0.9 },
            { confidenceScore: 0.8 }
          ]
        }
      }

      mockMarketingPipeline.analyzeMarketingCompliance.mockResolvedValueOnce(mockMarketingResult)

      const result = await aiService.analyzeCompliance(
        'Test marketing document with zero risk investment',
        'doc-123',
        'user-123'
      )

      expect(result.complianceScore).toBe(78)
      expect(result.overallStatus).toBe('needs_review')
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toEqual({
        category: 'fair_practices',
        title: 'Misleading Claims',
        description: 'Claims may mislead customers',
        severity: 'high',
        confidence: 0.85,
        suggestion: 'low risk investment subject to market conditions'
      })
      expect(result.confidence).toBe(0.85) // Average of AI violations confidence scores
    })
  })
})