import OpenAI from 'openai'
import { logger, logAnalysis, performanceLogger } from '../utils/logger'
// import { analysisCache, createCacheKey, hashText, getCachedAnalysisResult, cacheAnalysisResult } from '../utils/cache'
import { analyzeTextContent } from '../middleware/validation'
import { marketingPipeline, MarketingAnalysisResult } from '../core-engine/pipeline/marketing-analysis-pipeline'
import { databaseService } from './database-service'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ComplianceAnalysis {
  complianceScore: number
  overallStatus: 'compliant' | 'non_compliant' | 'needs_review'
  violations: Array<{
    category: string
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    confidence: number
    suggestion: string | null
  }>
  confidence: number
}

export class AIService {
  /**
   * Main compliance analysis method - now routes to marketing pipeline
   */
  async analyzeCompliance(
    text: string, 
    documentId: string, 
    userId: string, 
    scanConfig?: any
  ): Promise<ComplianceAnalysis> {
    try {
      // Determine marketing context based on scan configuration
      let marketingContext = 'general_marketing'
      
      if (scanConfig?.contentType) {
        switch (scanConfig.contentType) {
          case 'social_media':
            marketingContext = 'social_media_marketing'
            break
          case 'website_content':
            marketingContext = 'website_marketing'
            break
          case 'advertisement':
            marketingContext = 'advertisement_marketing'
            break
          case 'email_campaign':
            marketingContext = 'email_marketing'
            break
          case 'brochure':
            marketingContext = 'brochure_marketing'
            break
          case 'presentation':
            marketingContext = 'presentation_marketing'
            break
          default:
            marketingContext = 'general_marketing'
        }
      }

      // Use the new marketing compliance pipeline for comprehensive analysis
      const marketingResult = await marketingPipeline.analyzeMarketingCompliance(
        text, 
        userId, 
        documentId,
        marketingContext
      )

      // Convert marketing result to legacy format for backward compatibility
      return this.convertToLegacyFormat(marketingResult)

    } catch (error: any) {
      logger.error('Marketing compliance analysis failed, falling back to legacy', {
        documentId,
        userId,
        error: error.message
      })

      // Fallback to legacy analysis if marketing pipeline fails
      return this.legacyAnalyzeCompliance(text, documentId, userId, scanConfig)
    }
  }

  /**
   * Marketing-specific compliance analysis (new primary method)
   */
  async analyzeMarketingCompliance(
    text: string, 
    documentId: string, 
    userId: string, 
    marketingContext?: string
  ): Promise<MarketingAnalysisResult> {
    return marketingPipeline.analyzeMarketingCompliance(text, userId, documentId, marketingContext)
  }

  /**
   * Quick compliance check for marketing materials
   */
  async quickMarketingCheck(text: string, userId: string, marketingContext?: string) {
    return marketingPipeline.quickComplianceCheck(text, userId, marketingContext)
  }

  /**
   * Legacy compliance analysis method (fallback)
   */
  async legacyAnalyzeCompliance(text: string, documentId: string, userId: string, scanConfig?: any): Promise<ComplianceAnalysis> {
    const startTime = Date.now()
    const textHash = require('crypto').createHash('md5').update(text).digest('hex')
    const aiModel = 'gpt-4'
    
    try {
      // Validate text content
      const contentAnalysis = analyzeTextContent(text)
      if (!contentAnalysis.isValid) {
        logger.warn('Text content validation failed', {
          documentId,
          userId,
          warnings: contentAnalysis.warnings,
          metrics: contentAnalysis.metrics
        })
      }
      
      // Cache temporarily disabled for startup
      
      logAnalysis.start(documentId, userId, text.length)
      const prompt = `
        Analyze the following document text for RBI (Reserve Bank of India) compliance issues.
        
        Focus on:
        1. Data protection and privacy
        2. Financial reporting standards
        3. Risk management requirements
        4. Customer due diligence
        5. Anti-money laundering provisions
        6. Operational risk management
        7. Technology and cybersecurity guidelines
        
        Document text:
        ${text}
        
        Provide your analysis in the following JSON format:
        {
          "complianceScore": <number between 0-100>,
          "overallStatus": "<compliant|non_compliant|needs_review>",
          "violations": [
            {
              "category": "<compliance category>",
              "title": "<violation title>",
              "description": "<detailed description>",
              "severity": "<low|medium|high|critical>",
              "confidence": <number between 0-1>,
              "suggestion": "<suggested fix>"
            }
          ],
          "confidence": <overall confidence score 0-1>
        }
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert RBI compliance analyst. Analyze documents for compliance issues and provide structured feedback in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const analysisText = response.choices[0]?.message?.content
      if (!analysisText) {
        throw new Error('No analysis response from AI')
      }

      // Parse the JSON response
      const analysis: ComplianceAnalysis = JSON.parse(analysisText)
      
      // Save results using database service
      await databaseService.saveAnalysisResults({
        complianceScore: analysis.complianceScore,
        overallStatus: analysis.overallStatus,
        violations: analysis.violations,
        confidence: analysis.confidence,
        aiModelUsed: aiModel
      }, documentId, userId)
      
      // Update document status
      await databaseService.updateDocumentStatus(documentId, 'analyzed')
      
      // Cache temporarily disabled for startup
      
      const duration = Date.now() - startTime
      logAnalysis.complete(documentId, userId, duration, analysis.complianceScore)
      
      return analysis
    } catch (error: any) {
      const duration = Date.now() - startTime
      logAnalysis.error(documentId, userId, error, duration)
      
      logger.error('AI analysis error', {
        documentId,
        userId,
        textLength: text.length,
        duration,
        error: error.message
      })
      
      throw new Error('Failed to analyze document compliance')
    }
  }

  /**
   * Convert marketing analysis result to legacy format for backward compatibility
   */
  private convertToLegacyFormat(marketingResult: MarketingAnalysisResult): ComplianceAnalysis {
    const violations = marketingResult.complianceReport.violations.map(violation => ({
      category: violation.rule.category,
      title: violation.rule.title,
      description: violation.rule.description,
      severity: violation.severity,
      confidence: violation.confidence,
      suggestion: marketingResult.recommendations.specificFixes
        .find(fix => fix.originalText === violation.matchedText)?.suggestedText || null
    }))

    return {
      complianceScore: marketingResult.complianceReport.score.totalScore,
      overallStatus: marketingResult.complianceReport.score.complianceLevel,
      violations,
      confidence: marketingResult.aiInsights.aiViolations.length > 0 
        ? marketingResult.aiInsights.aiViolations.reduce((sum, v) => sum + v.confidenceScore, 0) / marketingResult.aiInsights.aiViolations.length
        : 0.8
    }
  }

  /**
   * Validate marketing engine setup
   */
  async validateMarketingEngine(): Promise<{ isReady: boolean; issues: string[] }> {
    try {
      return await marketingPipeline.validateSetup()
    } catch (error: any) {
      logger.error('Marketing engine validation failed', { error: error.message })
      return {
        isReady: false,
        issues: [`Marketing engine validation failed: ${error.message}`]
      }
    }
  }

}