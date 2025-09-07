import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { logger } from '../utils/logger'
import { marketingPipeline } from '../core-engine/pipeline/marketing-analysis-pipeline'
import { supabase } from '../config/supabase'
import { z } from 'zod'

// Validation schemas
const analyzeContentSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters').max(50000, 'Content too large'),
  marketingContext: z.string().optional(),
  documentType: z.enum(['advertisement', 'brochure', 'website_content', 'app_description', 'social_media', 'email_marketing']).optional()
})

const quickCheckSchema = z.object({
  content: z.string().min(5, 'Content must be at least 5 characters').max(10000, 'Content too large for quick check'),
  marketingContext: z.string().optional()
})

export const analyzeMarketingContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Validate request body
    const result = analyzeContentSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }

    const { content, marketingContext, documentType } = result.data
    const documentId = req.params.documentId

    logger.info('Marketing content analysis requested', {
      userId: req.user.id,
      documentId,
      contentLength: content.length,
      marketingContext,
      documentType
    })

    // Perform comprehensive marketing compliance analysis
    const analysisResult = await marketingPipeline.analyzeMarketingCompliance(
      content,
      req.user.id,
      documentId,
      marketingContext
    )

    // Structure response for client
    const response = {
      success: true,
      analysis: {
        // Core compliance data
        complianceScore: analysisResult.complianceReport.score.totalScore,
        complianceLevel: analysisResult.complianceReport.score.complianceLevel,
        riskLevel: analysisResult.complianceReport.score.riskIndicators.level,
        colorCode: analysisResult.complianceReport.score.colorCode,
        
        // Violations with citations
        violations: analysisResult.complianceReport.violations.map(violation => ({
          text: violation.matchedText,
          rule: violation.rule.title,
          category: violation.rule.category,
          severity: violation.severity,
          context: violation.context,
          citation: {
            document: violation.rule.citation.document,
            section: violation.rule.citation.section,
            url: violation.rule.citation.url
          },
          explanation: violation.rule.description
        })),

        // Required citations for all violations
        citations: analysisResult.complianceReport.citationsRequired,

        // Missing required elements
        missingElements: analysisResult.complianceReport.missingElements,

        // AI insights
        aiInsights: {
          contextualInsights: analysisResult.aiInsights.contextualInsights,
          toneAssessment: analysisResult.aiInsights.marketingToneAssessment,
          aiViolations: analysisResult.aiInsights.aiViolations
        },

        // Actionable recommendations
        recommendations: {
          overallApproach: analysisResult.recommendations.overallApproach,
          specificFixes: analysisResult.recommendations.specificFixes.slice(0, 10), // Top 10 fixes
          requiredAdditions: analysisResult.recommendations.additionsRequired,
          toneAdjustments: analysisResult.recommendations.toneAdjustments,
          alternativeVersions: analysisResult.recommendations.alternativeCopyVersions,
          complianceChecklist: analysisResult.recommendations.complianceChecklist
        },

        // Metadata
        metadata: analysisResult.metadata
      }
    }

    logger.info('Marketing content analysis completed', {
      userId: req.user.id,
      documentId,
      finalScore: analysisResult.complianceReport.score.totalScore,
      violationsCount: analysisResult.complianceReport.violations.length,
      processingTime: analysisResult.metadata.processingTimeMs
    })

    res.json(response)

  } catch (error: any) {
    logger.error('Marketing content analysis error', {
      userId: req.user?.id,
      documentId: req.params.documentId,
      error: error.message
    })
    
    res.status(500).json({
      success: false,
      error: 'Marketing analysis failed',
      details: error.message
    })
  }
}

export const quickMarketingCheck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = quickCheckSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }

    const { content, marketingContext } = result.data

    logger.info('Quick marketing check requested', {
      userId: req.user.id,
      contentLength: content.length
    })

    const checkResult = await marketingPipeline.quickComplianceCheck(
      content,
      req.user.id,
      marketingContext
    )

    res.json({
      success: true,
      check: checkResult
    })

  } catch (error: any) {
    logger.error('Quick marketing check error', {
      userId: req.user?.id,
      error: error.message
    })
    
    res.status(500).json({
      success: false,
      error: 'Quick check failed',
      details: error.message
    })
  }
}

export const getMarketingRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { documentId } = req.params

    // Get the latest analysis results for this document
    const { data: analysisResult, error } = await supabase
      .from('analysis_results')
      .select(`
        *,
        violations (*)
      `)
      .eq('document_id', documentId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !analysisResult) {
      return res.status(404).json({ 
        error: 'No analysis results found for this document',
        message: 'Please analyze the document first'
      })
    }

    res.json({
      success: true,
      documentId,
      analysisDate: analysisResult.created_at,
      complianceScore: analysisResult.compliance_score,
      violations: analysisResult.violations,
      recommendations: {
        message: 'For detailed recommendations, perform a new analysis',
        quickTips: [
          'Remove guarantee and assured claims',
          'Add required disclosures (APR, fees, T&Cs)',
          'Include grievance redressal information',
          'Use professional, transparent language',
          'Avoid high-pressure marketing tactics'
        ]
      }
    })

  } catch (error: any) {
    logger.error('Get marketing recommendations error', {
      userId: req.user?.id,
      documentId: req.params.documentId,
      error: error.message
    })
    
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
      details: error.message
    })
  }
}

export const getComplianceStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const statistics = await marketingPipeline.getComplianceStatistics(req.user.id)

    res.json({
      success: true,
      statistics
    })

  } catch (error: any) {
    logger.error('Get compliance statistics error', {
      userId: req.user?.id,
      error: error.message
    })
    
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    })
  }
}

export const validateMarketingSetup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const validation = await marketingPipeline.validateSetup()

    res.json({
      success: true,
      validation: {
        isReady: validation.isReady,
        issues: validation.issues,
        components: {
          guidelinesLoaded: validation.guidelinesCount > 0,
          guidelinesCount: validation.guidelinesCount,
          aiModelReady: validation.aiModelReady,
          geminiConfigured: !!process.env.GOOGLE_AI_API_KEY
        },
        recommendations: validation.isReady 
          ? ['Marketing compliance engine is ready']
          : [
              'Fix configuration issues before using marketing analysis',
              'Ensure GOOGLE_AI_API_KEY is set',
              'Verify RBI marketing guidelines are loaded'
            ]
      }
    })

  } catch (error: any) {
    logger.error('Marketing setup validation error', {
      userId: req.user?.id,
      error: error.message
    })
    
    res.status(500).json({
      success: false,
      error: 'Setup validation failed',
      details: error.message
    })
  }
}