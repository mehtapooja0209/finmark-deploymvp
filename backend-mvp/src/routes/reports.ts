import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.enhanced'
import { validateDocumentId } from '../middleware/validation'
import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { supabase } from '../config/supabase'
import { reportGenerationService, ReportConfig, ExportSettings } from '../services/reportGeneration'
import { z } from 'zod'

const router = Router()

// All routes require authentication
router.use(authenticateUser)

// Validation schemas
const ReportConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  template: z.enum(['executive_summary', 'detailed_audit', 'trend_analysis', 'impact_assessment']),
  dateRange: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'last_6_months', 'last_year']).default('last_30_days'),
  contentTypes: z.array(z.string()).optional(),
  violationCategories: z.array(z.string()).optional(),
  departments: z.array(z.string()).optional(),
  regulatoryFrameworks: z.array(z.string()).optional(),
  includeCharts: z.boolean().default(true),
  includeMetrics: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true)
})

const ExportSettingsSchema = z.object({
  format: z.enum(['pdf', 'excel', 'powerpoint', 'word']).default('pdf'),
  quality: z.enum(['high', 'medium', 'low']).default('high'),
  includeCharts: z.boolean().default(true),
  includeRawData: z.boolean().default(false),
  includeAppendix: z.boolean().default(true),
  password: z.string().optional(),
  watermark: z.boolean().default(false)
})

// Generate comprehensive report with PDF output
router.post('/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Validate request body
    const configValidation = ReportConfigSchema.safeParse(req.body.config)
    const exportValidation = ExportSettingsSchema.safeParse(req.body.exportSettings)

    if (!configValidation.success) {
      return res.status(400).json({ 
        error: 'Invalid report configuration',
        details: configValidation.error.issues 
      })
    }

    if (!exportValidation.success) {
      return res.status(400).json({ 
        error: 'Invalid export settings',
        details: exportValidation.error.issues 
      })
    }

    const config = configValidation.data as ReportConfig
    const exportSettings = exportValidation.data as ExportSettings

    // Create report generation record
    const { data: reportRecord, error: insertError } = await supabase
      .from('generated_reports')
      .insert({
        name: config.title,
        description: config.description,
        template_type: config.template,
        config: config,
        export_settings: exportSettings,
        user_id: req.user.id,
        status: 'generating'
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`)
    }

    // Generate the actual PDF report
    try {
      const fileName = await reportGenerationService.generateReport(
        req.user.id,
        config,
        exportSettings
      )

      // Update report record with completion
      const { error: updateError } = await supabase
        .from('generated_reports')
        .update({
          status: 'completed',
          file_name: fileName,
          completed_at: new Date().toISOString()
        })
        .eq('id', reportRecord.id)

      if (updateError) {
        console.error('Failed to update report record:', updateError)
      }

      // Get download URL
      const { data: downloadUrl } = await supabase.storage
        .from('reports')
        .createSignedUrl(`reports/${fileName}`, 3600) // 1 hour expiry

      res.json({
        success: true,
        message: 'Report generated successfully',
        reportId: reportRecord.id,
        fileName,
        downloadUrl: downloadUrl?.signedUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      })

    } catch (generationError: any) {
      // Update report record with error
      await supabase
        .from('generated_reports')
        .update({
          status: 'failed',
          error_message: generationError.message
        })
        .eq('id', reportRecord.id)

      throw generationError
    }

  } catch (error: any) {
    console.error('Report generation error:', error)
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    })
  }
})

// Get report templates
router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data: templates, error } = await supabase
      .from('report_templates')
      .select('*')
      .or(`user_id.eq.${req.user.id},is_default.eq.true`)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    res.json({ templates })
  } catch (error: any) {
    console.error('Get templates error:', error)
    res.status(500).json({ 
      error: 'Failed to get templates',
      details: error.message 
    })
  }
})

// Save report template
router.post('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { name, description, template_type, config } = req.body

    if (!name || !template_type || !config) {
      return res.status(400).json({ error: 'Name, template_type, and config are required' })
    }

    const { data: template, error } = await supabase
      .from('report_templates')
      .insert({
        name,
        description,
        template_type,
        config,
        user_id: req.user.id
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    res.json({ 
      success: true,
      message: 'Template saved successfully',
      template 
    })
  } catch (error: any) {
    console.error('Save template error:', error)
    res.status(500).json({ 
      error: 'Failed to save template',
      details: error.message 
    })
  }
})

// Get report history
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const { data: reports, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Get download URLs for completed reports
    const reportsWithUrls = await Promise.all(
      (reports || []).map(async (report) => {
        if (report.status === 'completed' && report.file_name) {
          try {
            const { data: downloadUrl } = await supabase.storage
              .from('reports')
              .createSignedUrl(`reports/${report.file_name}`, 3600)
            
            return {
              ...report,
              downloadUrl: downloadUrl?.signedUrl
            }
          } catch (error) {
            console.error('Failed to create download URL:', error)
            return report
          }
        }
        return report
      })
    )

    res.json({ reports: reportsWithUrls })
  } catch (error: any) {
    console.error('Get report history error:', error)
    res.status(500).json({ 
      error: 'Failed to get report history',
      details: error.message 
    })
  }
})

// Generate analysis report for a document (legacy endpoint)
router.get('/analysis/:documentId', validateDocumentId, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { documentId } = req.params
    const format = req.query.format as string || 'json'

    // Get analysis results with violations
    const { data: analysisResults, error } = await supabase
      .from('analysis_results')
      .select(`
        *,
        violations (*),
        documents (name, original_name, file_type, extracted_text)
      `)
      .eq('document_id', documentId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Analysis results not found' })
      }
      throw new Error(`Database error: ${error.message}`)
    }

    if (!analysisResults) {
      return res.status(404).json({ error: 'No analysis results found for this document' })
    }

    // Format based on request
    if (format === 'json') {
      return res.json({ report: analysisResults })
    } 
    else if (format === 'pdf') {
      // Generate quick report for single document
      const config: ReportConfig = {
        title: `Analysis Report - ${analysisResults.documents?.original_name}`,
        description: 'Single document compliance analysis',
        template: 'detailed_audit',
        dateRange: 'last_30_days',
        includeCharts: true,
        includeMetrics: true,
        includeRecommendations: true
      }

      const exportSettings: ExportSettings = {
        format: 'pdf',
        quality: 'high',
        includeCharts: true,
        includeRawData: false,
        includeAppendix: true,
        watermark: false
      }

      const fileName = await reportGenerationService.generateReport(
        req.user.id,
        config,
        exportSettings
      )

      const { data: downloadUrl } = await supabase.storage
        .from('reports')
        .createSignedUrl(`reports/${fileName}`, 3600)

      res.json({ 
        success: true,
        fileName,
        downloadUrl: downloadUrl?.signedUrl,
        message: 'PDF report generated successfully'
      })
    }
    else {
      return res.status(400).json({ error: 'Unsupported format. Use "json" or "pdf".' })
    }
  } catch (error: any) {
    console.error('Generate report error:', error)
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    })
  }
})

// Generate violations report across multiple documents (legacy endpoint)
router.get('/violations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const format = req.query.format as string || 'json'
    
    // Get filters from query params
    const filters: any = {}
    if (req.query.severity) filters.severity = req.query.severity
    if (req.query.type) filters.type = req.query.type
    if (req.query.status) filters.status = req.query.status
    
    // Get violations with related document info
    let query = supabase
      .from('violations')
      .select(`
        *,
        analysis_results!inner (
          compliance_score,
          document_id,
          created_at,
          user_id,
          documents (
            name,
            original_name,
            type
          )
        )
      `)
      .eq('analysis_results.user_id', req.user.id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    
    const { data: violations, error } = await query
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Format based on request
    if (format === 'json') {
      return res.json({ violations })
    } 
    else if (format === 'pdf') {
      // Generate violations trend report
      const config: ReportConfig = {
        title: 'Violations Report',
        description: 'Comprehensive violations analysis',
        template: 'trend_analysis',
        dateRange: 'last_90_days',
        includeCharts: true,
        includeMetrics: true,
        includeRecommendations: true
      }

      const exportSettings: ExportSettings = {
        format: 'pdf',
        quality: 'high',
        includeCharts: true,
        includeRawData: true,
        includeAppendix: true,
        watermark: false
      }

      const fileName = await reportGenerationService.generateReport(
        req.user.id,
        config,
        exportSettings
      )

      const { data: downloadUrl } = await supabase.storage
        .from('reports')
        .createSignedUrl(`reports/${fileName}`, 3600)

      res.json({ 
        success: true,
        fileName,
        downloadUrl: downloadUrl?.signedUrl,
        message: 'PDF violations report generated successfully'
      })
    }
    else {
      return res.status(400).json({ error: 'Unsupported format. Use "json" or "pdf".' })
    }
  } catch (error: any) {
    console.error('Generate violations report error:', error)
    res.status(500).json({ 
      error: 'Failed to generate violations report',
      details: error.message 
    })
  }
})

// Helper function to determine compliance status
function getComplianceStatus(score: number): string {
  if (score >= 80) return 'Compliant'
  if (score >= 60) return 'Needs Review'
  return 'Non-Compliant'
}

export default router
