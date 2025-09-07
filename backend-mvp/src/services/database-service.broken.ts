import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { MarketingAnalysisResult } from '../core-engine/pipeline/marketing-analysis-pipeline'
import { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js'
import { 
  Database, 
  AnalysisResultInsert, 
  ViolationInsert, 
  DocumentUpdate,
  AnalysisResultRow,
  ViolationRow,
  ComplianceStatus
} from '../types/database'

// Type-safe Supabase client
type TypedSupabaseClient = SupabaseClient<Database>

export interface ComplianceAnalysisData {
  complianceScore: number
  overallStatus: ComplianceStatus
  violations: Array<{
    category: string
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    confidence: number
    suggestion: string | null
  }>
  confidence: number
  aiModelUsed: string
}

/**
 * Dedicated database service for all analysis-related database operations
 * Single source of truth for database interactions
 */
export class DatabaseService {
  private readonly typedSupabase: TypedSupabaseClient = supabase as TypedSupabaseClient

  /**
   * Save analysis results and violations to database
   */
  async saveAnalysisResults(
    analysisData: ComplianceAnalysisData,
    documentId: string,
    userId: string
  ): Promise<AnalysisResultRow> {
    try {
      logger.debug('Saving analysis results to database', {
        documentId,
        userId,
        complianceScore: analysisData.complianceScore,
        violationsCount: analysisData.violations.length
      })

      // Save main analysis result
      const analysisInsert: AnalysisResultInsert = {
        document_id: documentId,
        compliance_score: analysisData.complianceScore,
        overall_status: analysisData.overallStatus,
        ai_model_used: analysisData.aiModelUsed,
        confidence: analysisData.confidence,
        user_id: userId,
        created_at: new Date().toISOString(),
        analysis_metadata: {}
      }
      
      const { data: analysisResult, error: analysisError } = await this.typedSupabase
        .from('analysis_results')
        .insert(analysisInsert)
        .select()
        .single() as { data: AnalysisResultRow | null; error: any }

      if (analysisError) {
        throw new Error(`Failed to save analysis: ${analysisError.message}`)
      }

      if (!analysisResult) {
        throw new Error('Analysis result was not returned after insert')
      }

      // Save violations if any exist
      if (analysisData.violations.length > 0) {
        await this.saveViolations(analysisResult.id, analysisData.violations)
      }

      logger.info('Analysis results saved successfully', {
        documentId,
        userId,
        analysisId: analysisResult.id,
        violationsCount: analysisData.violations.length
      })

      return analysisResult

    } catch (error: any) {
      logger.error('Failed to save analysis results', {
        documentId,
        userId,
        error: error.message
      })
      throw new Error(`Database save failed: ${error.message}`)
    }
  }

  /**
   * Save marketing analysis results (specific format)
   */
  async saveMarketingAnalysisResults(
    result: MarketingAnalysisResult,
    documentId: string,
    userId: string
  ): Promise<AnalysisResultRow> {
    try {
      // Convert marketing result to standard format
      const analysisData: ComplianceAnalysisData = {
        complianceScore: result.complianceReport.score.totalScore,
        overallStatus: result.complianceReport.score.complianceLevel,
        aiModelUsed: 'gemini-pro + rule-engine',
        confidence: result.aiInsights.aiViolations.length > 0 
          ? result.aiInsights.aiViolations.reduce((sum, v) => sum + v.confidenceScore, 0) / result.aiInsights.aiViolations.length
          : 0.8,
        violations: result.complianceReport.violations.map(violation => ({
          category: violation.rule.category,
          title: violation.rule.title,
          description: violation.rule.description,
          severity: violation.severity,
          confidence: violation.confidence,
          suggestion: result.recommendations.specificFixes
            .find(fix => fix.originalText === violation.matchedText)?.suggestedText || null
        }))
      }

      return await this.saveAnalysisResults(analysisData, documentId, userId)

    } catch (error: any) {
      logger.error('Failed to save marketing analysis results', {
        documentId,
        userId,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(documentId: string, status: 'uploaded' | 'processing' | 'analyzed' | 'error'): Promise<void> {
    try {
      logger.debug(`Updating document status to ${status}`, { documentId })

      const updateData: DocumentUpdate = { 
        status,
        updated_at: new Date().toISOString()
      }

      const { error } = await this.typedSupabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)

      if (error) {
        throw new Error(`Failed to update document status: ${error.message}`)
      }

      logger.debug('Document status updated', { documentId, status })

    } catch (error: any) {
      logger.error('Failed to update document status', {
        documentId,
        status,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get analysis results for a document
   */
  async getAnalysisResults(documentId: string, userId: string): Promise<{
    analysis: AnalysisResultRow
    violations: ViolationRow[]
  } | null> {
    try {
      const { data: analysis, error: analysisError } = await this.typedSupabase
        .from('analysis_results')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: AnalysisResultRow | null; error: any }

      if (analysisError) {
        throw new Error(`Failed to get analysis: ${analysisError.message}`)
      }

      if (!analysis) {
        return null
      }

      const { data: violations, error: violationsError } = await this.typedSupabase
        .from('violations')
        .select('*')
        .eq('analysis_result_id', analysis.id)
        .order('created_at', { ascending: false }) as { data: ViolationRow[] | null; error: any }

      if (violationsError) {
        throw new Error(`Failed to get violations: ${violationsError.message}`)
      }

      return {
        analysis,
        violations: violations || []
      }

    } catch (error: any) {
      logger.error('Failed to get analysis results', {
        documentId,
        userId,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get compliance statistics for a user
   */
  async getComplianceStatistics(userId: string): Promise<{
    totalAnalyses: number;
    averageScore: number;
    complianceLevels: { compliant: number; needs_review: number; non_compliant: number };
    recentAnalyses: any[];
  }> {
    try {
      logger.debug('Fetching compliance statistics', { userId })
      
      const { data: analyses, error } = await this.typedSupabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as { data: AnalysisResultRow[] | null; error: any }
      
      if (error) {
        throw new Error(`Failed to fetch analyses: ${error.message}`)
      }
      
      const totalAnalyses = analyses?.length || 0
      const averageScore = totalAnalyses > 0
        ? analyses!.reduce((sum, analysis) => sum + analysis.compliance_score, 0) / totalAnalyses
        : 0
      
      const complianceLevels = analyses?.reduce((acc, analysis) => {
        acc[analysis.overall_status]++
        return acc
      }, { compliant: 0, needs_review: 0, non_compliant: 0 } as Record<ComplianceStatus, number>) || 
      { compliant: 0, needs_review: 0, non_compliant: 0 }
      
      return {
        totalAnalyses,
        averageScore,
        complianceLevels,
        recentAnalyses: analyses?.slice(0, 10) || []
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
   * Private method to save violations
   */
  private async saveViolations(analysisResultId: string, violations: any[]): Promise<void> {
    if (!violations || violations.length === 0) {
      logger.debug('No violations to save', { analysisResultId })
      return
    }

    logger.debug(`Saving ${violations.length} violations`, { analysisResultId })

    // Map violations to database schema
    const violationsToInsert: ViolationInsert[] = violations.map(violation => ({
      analysis_result_id: analysisResultId,
      category: violation.category,
      title: violation.title,
      description: violation.description,
      severity: violation.severity,
      confidence: violation.confidence,
      suggestion: violation.suggestion || null,
      created_at: new Date().toISOString(),
      violation_metadata: {},
      remediation_options: {}
    }))

    const { error } = await this.typedSupabase
      .from('violations')
      .insert(violationsToInsert)

    if (error) {
      throw new Error(`Failed to save violations: ${error.message}`)
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()