import { ruleEngine, ComplianceAnalysis } from '../marketing-rules/fintech-rule-engine'
import { complianceScorer, ComplianceReport } from '../scoring/marketing-scorer'
import { geminiAnalyzer, GeminiAnalysisResult } from '../ai/gemini-marketing-analyzer'
import { marketingFixGenerator, MarketingRecommendations } from '../recommendations/marketing-fix-generator'
import { marketingLoader } from '../marketing-rules/rbi-marketing-loader'
import { logger, performanceLogger } from '../../utils/logger'
import { analysisCache, createCacheKey, hashText } from '../../utils/cache'
import { databaseService } from '../../services/database-service'

export interface MarketingAnalysisResult {
  complianceReport: ComplianceReport
  aiInsights: GeminiAnalysisResult
  recommendations: MarketingRecommendations
  metadata: {
    documentId?: string
    userId: string
    analysisType: 'marketing_compliance'
    processingTimeMs: number
    rulesApplied: number
    cacheUsed: boolean
    analysisDate: string
  }
}

export class MarketingAnalysisPipeline {
  constructor() {}

  /**
   * Complete marketing compliance analysis pipeline
   */
  async analyzeMarketingCompliance(
    text: string,
    userId: string,
    documentId?: string,
    marketingContext?: string
  ): Promise<MarketingAnalysisResult> {
    const startTime = Date.now()
    
    try {
      logger.info('Starting marketing compliance analysis pipeline', {
        userId,
        documentId,
        textLength: text.length,
        hasContext: !!marketingContext
      })

      // Check cache first
      const textHash = hashText(text)
      const cacheKey = createCacheKey.analysis(documentId || textHash, { marketing: true, context: marketingContext })
      
      const cachedResult = await analysisCache.get(cacheKey) as MarketingAnalysisResult | undefined
      if (cachedResult && cachedResult.complianceReport && cachedResult.aiInsights && cachedResult.recommendations) {
        logger.info('Serving marketing analysis from cache', { userId, documentId, textHash })
        return {
          complianceReport: cachedResult.complianceReport,
          aiInsights: cachedResult.aiInsights,
          recommendations: cachedResult.recommendations,
          metadata: {
            ...cachedResult.metadata,
            cacheUsed: true,
            processingTimeMs: Date.now() - startTime
          }
        }
      }

      // Stage 1: Rule-based compliance analysis
      logger.debug('Stage 1: Rule-based compliance analysis')
      const ruleBasedAnalysis = await performanceLogger.track(
        'rule_based_analysis',
        () => ruleEngine.analyzeMarketingCompliance(text, marketingContext)
      )

      // Stage 2: AI-enhanced analysis with Gemini
      logger.debug('Stage 2: AI-enhanced analysis with Gemini')
      const aiInsights = await performanceLogger.track(
        'gemini_analysis',
        () => geminiAnalyzer.analyzeMarketingContent(
          text,
          ruleBasedAnalysis.appliedRules,
          ruleBasedAnalysis.violations
        )
      )

      // Stage 3: Generate comprehensive compliance report
      logger.debug('Stage 3: Generating compliance report')
      const complianceReport = await performanceLogger.track(
        'compliance_scoring',
        () => complianceScorer.generateComplianceReport(ruleBasedAnalysis)
      )

      // Stage 4: Generate marketing recommendations
      logger.debug('Stage 4: Generating marketing recommendations')
      const recommendations = await performanceLogger.track(
        'recommendation_generation',
        () => marketingFixGenerator.generateMarketingRecommendations(
          text,
          ruleBasedAnalysis.violations,
          ruleBasedAnalysis.missingElements,
          aiInsights
        )
      )

      const processingTime = Date.now() - startTime

      const result: MarketingAnalysisResult = {
        complianceReport,
        aiInsights,
        recommendations,
        metadata: {
          documentId,
          userId,
          analysisType: 'marketing_compliance',
          processingTimeMs: processingTime,
          rulesApplied: ruleBasedAnalysis.appliedRules.length,
          cacheUsed: false,
          analysisDate: new Date().toISOString()
        }
      }

      // Cache the result
      await analysisCache.set(cacheKey, result, 1800) // Cache for 30 minutes

      // Save to database if documentId provided
      if (documentId) {
        await databaseService.saveMarketingAnalysisResults(result, documentId, userId)
        await databaseService.updateDocumentStatus(documentId, 'analyzed')
      }

      logger.info('Marketing compliance analysis completed', {
        userId,
        documentId,
        finalScore: complianceReport.score.totalScore,
        complianceLevel: complianceReport.score.complianceLevel,
        violationsCount: ruleBasedAnalysis.violations.length,
        processingTime,
        aiInsightsCount: aiInsights.aiViolations.length,
        recommendationsCount: recommendations.specificFixes.length
      })

      return result

    } catch (error: any) {
      const processingTime = Date.now() - startTime
      
      logger.error('Marketing compliance analysis failed', {
        userId,
        documentId,
        error: error.message,
        processingTime,
        textLength: text.length
      })

      throw new Error(`Marketing analysis failed: ${error.message}`)
    }
  }

  /**
   * Quick compliance check (rule-based only, no AI)
   */
  async quickComplianceCheck(
    text: string,
    userId: string,
    marketingContext?: string
  ): Promise<{
    score: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    topViolations: Array<{ text: string; rule: string; severity: string }>
    processingTimeMs: number
  }> {
    const startTime = Date.now()

    try {
      logger.info('Starting quick compliance check', {
        userId,
        textLength: text.length
      })

      const analysis = await ruleEngine.analyzeMarketingCompliance(text, marketingContext)
      const processingTime = Date.now() - startTime

      const topViolations = analysis.violations
        .slice(0, 5) // Top 5 violations
        .map(v => ({
          text: v.matchedText,
          rule: v.rule.title,
          severity: v.severity
        }))

      const result = {
        score: analysis.overallScore,
        riskLevel: analysis.analysisMetadata.riskLevel,
        topViolations,
        processingTimeMs: processingTime
      }

      logger.info('Quick compliance check completed', {
        userId,
        score: result.score,
        riskLevel: result.riskLevel,
        violationsFound: topViolations.length,
        processingTime
      })

      return result

    } catch (error: any) {
      logger.error('Quick compliance check failed', {
        userId,
        error: error.message,
        processingTime: Date.now() - startTime
      })

      return {
        score: 50,
        riskLevel: 'medium',
        topViolations: [{ text: 'Analysis failed', rule: 'System Error', severity: 'high' }],
        processingTimeMs: Date.now() - startTime
      }
    }
  }

  /**
   * Batch analyze multiple marketing materials
   */
  async batchAnalyzeMarketing(
    texts: Array<{ id: string; content: string; context?: string }>,
    userId: string
  ): Promise<Array<{
    id: string
    result: MarketingAnalysisResult | null
    error?: string
  }>> {
    logger.info('Starting batch marketing analysis', {
      userId,
      batchSize: texts.length
    })

    const results: Array<{
      id: string
      result: MarketingAnalysisResult | null
      error?: string
    }> = []

    for (const item of texts) {
      try {
        const result = await this.analyzeMarketingCompliance(
          item.content,
          userId,
          item.id,
          item.context
        )
        
        results.push({
          id: item.id,
          result,
          error: undefined
        })
        
      } catch (error: any) {
        logger.error('Batch item analysis failed', {
          userId,
          itemId: item.id,
          error: error.message
        })
        
        results.push({
          id: item.id,
          result: null,
          error: error.message
        })
      }
    }

    logger.info('Batch marketing analysis completed', {
      userId,
      totalItems: texts.length,
      successfulItems: results.filter(r => r.result !== null).length,
      failedItems: results.filter(r => r.result === null).length
    })

    return results
  }

  /**
   * Get marketing compliance statistics
   */
  async getComplianceStatistics(userId: string): Promise<{
    totalAnalyses: number
    averageScore: number
    complianceLevels: {
      compliant: number
      needs_review: number
      non_compliant: number
    }
    commonViolations: Array<{
      rule: string
      count: number
      category: string
    }>
    improvementTrend: Array<{
      date: string
      averageScore: number
    }>
  }> {
    try {
      // This would query the database for user's historical analysis data
      // For now, returning mock data structure
      return {
        totalAnalyses: 0,
        averageScore: 0,
        complianceLevels: {
          compliant: 0,
          needs_review: 0,
          non_compliant: 0
        },
        commonViolations: [],
        improvementTrend: []
      }
    } catch (error: any) {
      logger.error('Failed to get compliance statistics', {
        userId,
        error: error.message
      })
      throw error
    }
  }


  /**
   * Validate marketing guidelines are loaded
   */
  async validateSetup(): Promise<{
    isReady: boolean
    issues: string[]
    guidelinesCount: number
    aiModelReady: boolean
  }> {
    const issues: string[] = []
    let isReady = true

    // Check guidelines loading
    let guidelinesCount = 0
    try {
      const rules = await marketingLoader.getCachedRules()
      guidelinesCount = rules.length
      if (guidelinesCount === 0) {
        issues.push('No marketing guidelines loaded')
        isReady = false
      }
    } catch (error: any) {
      issues.push(`Guidelines loading error: ${error.message}`)
      isReady = false
    }

    // Check AI model availability
    let aiModelReady = false
    try {
      if (!process.env.GOOGLE_AI_API_KEY) {
        issues.push('Google AI API key not configured')
        isReady = false
      } else {
        aiModelReady = true
      }
    } catch (error: any) {
      issues.push(`AI model error: ${error.message}`)
      isReady = false
    }

    return {
      isReady,
      issues,
      guidelinesCount,
      aiModelReady
    }
  }
}

// Export singleton instance
export const marketingPipeline = new MarketingAnalysisPipeline()