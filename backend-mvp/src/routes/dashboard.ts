import { Router } from 'express'
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'

const router = Router()

// Real dashboard stats from database
router.get('/stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get user ID from authenticated request (for user-specific data)
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000' // fallback for testing

    // Run parallel queries for better performance
    const [
      documentsResult,
      analysesResult, 
      violationsResult,
      weeklyTrendResult
    ] = await Promise.all([
      // Total documents count
      supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      
      // Analysis results data
      supabase
        .from('analysis_results')
        .select('id, compliance_score, overall_status, created_at, processing_time_ms')
        .eq('user_id', userId),
      
      // Violations count - simplified approach
      supabase
        .from('violations')
        .select(`
          id, 
          analysis_result_id, 
          severity,
          analysis_results!inner (
            user_id
          )
        `)
        .eq('analysis_results.user_id', userId),
      
      // Weekly trend data (documents uploaded in last 7 days vs previous 7 days)
      supabase
        .from('documents')
        .select('id, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    ])

    if (documentsResult.error || analysesResult.error || violationsResult.error || weeklyTrendResult.error) {
      throw new Error('Failed to fetch dashboard data from database')
    }

    // Calculate metrics from real data
    const totalDocuments = documentsResult.count || 0
    const analyses = analysesResult.data || []
    const violations = violationsResult.data || []
    const weeklyDocs = weeklyTrendResult.data || []

    // Analysis statistics
    const completedAnalyses = analyses.filter(a => a.overall_status !== 'processing').length
    const pendingAnalyses = analyses.filter(a => a.overall_status === 'processing').length
    
    // Compliance score calculation
    const completedAnalysesWithScores = analyses.filter(a => a.compliance_score !== null)
    const averageComplianceScore = completedAnalysesWithScores.length > 0
      ? Math.round(completedAnalysesWithScores.reduce((sum, a) => sum + (a.compliance_score || 0), 0) / completedAnalysesWithScores.length * 10) / 10
      : 0

    // Violations statistics
    const activeViolations = violations.filter(v => v.severity === 'critical' || v.severity === 'high').length
    const resolvedViolations = violations.filter(v => v.severity === 'low' || v.severity === 'medium').length

    // Processing time calculation (average from last 10 analyses)
    const recentAnalyses = analyses
      .filter(a => a.processing_time_ms)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
    
    const avgProcessingMs = recentAnalyses.length > 0 
      ? recentAnalyses.reduce((sum, a) => sum + (a.processing_time_ms || 0), 0) / recentAnalyses.length
      : 0
    const processingTime = avgProcessingMs > 0 ? `${Math.round(avgProcessingMs / 1000)}s` : "0s"

    // Weekly trend calculation
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const thisWeekDocs = weeklyDocs.filter(d => new Date(d.created_at) >= weekAgo).length
    const lastWeekDocs = weeklyDocs.filter(d => {
      const docDate = new Date(d.created_at)
      return docDate >= twoWeeksAgo && docDate < weekAgo
    }).length

    const weeklyDocTrend = thisWeekDocs - lastWeekDocs

    // Compliance trend (simplified - could be enhanced with more sophisticated calculation)
    const recentComplianceScores = analyses
      .filter(a => a.compliance_score !== null && new Date(a.created_at) >= weekAgo)
      .map(a => a.compliance_score || 0)
    
    const prevWeekComplianceScores = analyses
      .filter(a => {
        const analysisDate = new Date(a.created_at)
        return a.compliance_score !== null && analysisDate >= twoWeeksAgo && analysisDate < weekAgo
      })
      .map(a => a.compliance_score || 0)

    const thisWeekAvgCompliance = recentComplianceScores.length > 0 
      ? recentComplianceScores.reduce((sum, score) => sum + score, 0) / recentComplianceScores.length 
      : 0
    const lastWeekAvgCompliance = prevWeekComplianceScores.length > 0 
      ? prevWeekComplianceScores.reduce((sum, score) => sum + score, 0) / prevWeekComplianceScores.length 
      : 0

    const complianceTrend = Math.round((thisWeekAvgCompliance - lastWeekAvgCompliance) * 10) / 10

    // Violations trend
    const thisWeekViolations = violations.filter(v => {
      // This would require joining with analysis_results to get the creation date
      // For now, using a simplified calculation
      return v.severity === 'critical' || v.severity === 'high'
    }).length

    const violationsTrend = -(thisWeekViolations - activeViolations) // Negative because fewer violations is good

    const realStats = {
      totalDocuments,
      completedAnalyses,
      pendingAnalyses,
      averageComplianceScore,
      activeViolations,
      resolvedViolations,
      totalUsers: 1, // For single-user MVP, always 1
      processingTime,
      weeklyTrend: {
        documents: weeklyDocTrend,
        compliance: complianceTrend,
        violations: violationsTrend
      }
    }

    res.json(realStats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    // Fallback to basic stats if database query fails
    const fallbackStats = {
      totalDocuments: 0,
      completedAnalyses: 0,
      pendingAnalyses: 0,
      averageComplianceScore: 0,
      activeViolations: 0,
      resolvedViolations: 0,
      totalUsers: 1,
      processingTime: "0s",
      weeklyTrend: {
        documents: 0,
        compliance: 0,
        violations: 0
      }
    }
    res.json(fallbackStats)
  }
})

// Real documents endpoint with database integration
router.get('/documents', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000' // fallback for testing
    
    // Extract pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    if (countError) {
      throw new Error('Failed to get documents count')
    }

    // Get documents with their analysis data
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        original_name,
        type,
        size,
        status,
        created_at,
        updated_at,
        analysis_results (
          id,
          compliance_score,
          overall_status,
          created_at,
          processing_time_ms
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (documentsError) {
      throw new Error('Failed to fetch documents')
    }

    // Format documents for frontend consumption
    const formattedDocuments = (documents || []).map(doc => ({
      id: doc.id,
      filename: doc.original_name || doc.name,
      status: doc.status === 'analyzed' ? 'completed' : 
              doc.status === 'processing' ? 'analyzing' :
              doc.status === 'error' ? 'error' : 'uploaded',
      uploadedAt: doc.created_at,
      updatedAt: doc.updated_at,
      size: formatFileSize(doc.size),
      type: doc.type,
      analysisId: doc.analysis_results?.[0]?.id || null,
      complianceScore: doc.analysis_results?.[0]?.compliance_score || null,
      analysisStatus: doc.analysis_results?.[0]?.overall_status || null,
      processingTime: doc.analysis_results?.[0]?.processing_time_ms 
        ? `${Math.round(doc.analysis_results[0].processing_time_ms / 1000)}s` 
        : null
    }))

    const totalPages = Math.ceil((totalCount || 0) / limit)

    const realDocuments = {
      data: formattedDocuments,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: totalPages
      }
    }

    res.json(realDocuments)
  } catch (error) {
    console.error('Dashboard documents error:', error)
    // Fallback response
    res.json({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    })
  }
})

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Real analyses endpoint with database integration
router.get('/analyses', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000' // fallback for testing
    
    // Extract pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('analysis_results')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    if (countError) {
      throw new Error('Failed to get analyses count')
    }

    // Get analyses with their document and violation data
    const { data: analyses, error: analysesError } = await supabase
      .from('analysis_results')
      .select(`
        id,
        document_id,
        compliance_score,
        overall_status,
        ai_model_used,
        confidence,
        processing_time_ms,
        tokens_used,
        created_at,
        updated_at,
        documents (
          id,
          name,
          original_name,
          type
        ),
        violations (
          id,
          severity,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (analysesError) {
      throw new Error('Failed to fetch analyses')
    }

    // Format analyses for frontend consumption
    const formattedAnalyses = (analyses || []).map((analysis: any) => ({
      id: analysis.id,
      documentId: analysis.document_id,
      filename: analysis.documents?.original_name || analysis.documents?.name || 'Unknown',
      documentType: analysis.documents?.type || 'unknown',
      status: analysis.overall_status === 'compliant' ? 'completed' : 
              analysis.overall_status === 'non_compliant' ? 'completed' :
              analysis.overall_status === 'needs_review' ? 'completed' : 'processing',
      complianceScore: analysis.compliance_score,
      overallStatus: analysis.overall_status,
      violationsFound: analysis.violations?.length || 0,
      violationBreakdown: {
        critical: analysis.violations?.filter(v => v.severity === 'critical').length || 0,
        high: analysis.violations?.filter(v => v.severity === 'high').length || 0,
        medium: analysis.violations?.filter(v => v.severity === 'medium').length || 0,
        low: analysis.violations?.filter(v => v.severity === 'low').length || 0
      },
      aiModel: analysis.ai_model_used,
      confidence: analysis.confidence,
      processingTime: analysis.processing_time_ms 
        ? `${Math.round(analysis.processing_time_ms / 1000)}s` 
        : null,
      tokensUsed: analysis.tokens_used,
      completedAt: analysis.created_at,
      updatedAt: analysis.updated_at
    }))

    const totalPages = Math.ceil((totalCount || 0) / limit)

    const realAnalyses = {
      data: formattedAnalyses,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: totalPages
      }
    }

    res.json(realAnalyses)
  } catch (error) {
    console.error('Dashboard analyses error:', error)
    // Fallback response
    res.json({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    })
  }
})

// New endpoint: Real-time activity feed
router.get('/activity', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000' // fallback for testing
    const limit = parseInt(req.query.limit as string) || 20

    // Get recent documents and analyses for activity feed
    const [documentsResult, analysesResult] = await Promise.all([
      supabase
        .from('documents')
        .select('id, name, original_name, type, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      
      supabase
        .from('analysis_results')
        .select(`
          id,
          document_id,
          compliance_score,
          overall_status,
          created_at,
          documents (
            name,
            original_name
          ),
          violations (
            id,
            severity
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ])

    if (documentsResult.error || analysesResult.error) {
      throw new Error('Failed to fetch activity data')
    }

    // Create activity items from documents
    const documentActivities = (documentsResult.data || []).map(doc => ({
      id: `doc_${doc.id}`,
      type: 'document_upload',
      message: `Document "${doc.original_name || doc.name}" uploaded`,
      details: `${doc.type.toUpperCase()} document`,
      timestamp: doc.created_at,
      status: doc.status,
      icon: 'Upload'
    }))

    // Create activity items from analyses
    const analysisActivities = (analysesResult.data || []).map((analysis: any) => ({
      id: `analysis_${analysis.id}`,
      type: 'analysis_complete',
      message: `Analysis completed for "${analysis.documents?.original_name || analysis.documents?.name || 'document'}"`,
      details: `Score: ${analysis.compliance_score}%, ${analysis.violations?.length || 0} violations found`,
      timestamp: analysis.created_at,
      status: analysis.overall_status,
      complianceScore: analysis.compliance_score,
      violationsFound: analysis.violations?.length || 0,
      violationBreakdown: {
        critical: analysis.violations?.filter(v => v.severity === 'critical').length || 0,
        high: analysis.violations?.filter(v => v.severity === 'high').length || 0
      },
      icon: analysis.overall_status === 'compliant' ? 'CheckCircle' : 
            analysis.overall_status === 'non_compliant' ? 'XCircle' : 'AlertCircle'
    }))

    // Combine and sort all activities
    const allActivities = [...documentActivities, ...analysisActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    res.json({
      data: allActivities,
      total: allActivities.length
    })
  } catch (error) {
    console.error('Dashboard activity error:', error)
    res.json({
      data: [],
      total: 0
    })
  }
})

// Chart data endpoints for dashboard visualizations
router.get('/charts/compliance-trends', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000'
    const days = parseInt(req.query.days as string) || 30

    // Get compliance scores over time
    const { data: analyses, error } = await supabase
      .from('analysis_results')
      .select('compliance_score, created_at')
      .eq('user_id', userId)
      .not('compliance_score', 'is', null)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error('Failed to fetch compliance trends')
    }

    // Group by day and calculate average compliance score
    const dailyScores: { [key: string]: number[] } = {}
    
    analyses?.forEach(analysis => {
      const date = new Date(analysis.created_at).toISOString().split('T')[0]
      if (!dailyScores[date]) {
        dailyScores[date] = []
      }
      dailyScores[date].push(analysis.compliance_score || 0)
    })

    // Calculate daily averages and format for chart
    const chartData = Object.entries(dailyScores).map(([date, scores]) => ({
      date,
      averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 10) / 10,
      analysesCount: scores.length
    }))

    res.json({
      data: chartData,
      period: `${days} days`,
      totalAnalyses: analyses?.length || 0
    })
  } catch (error) {
    console.error('Compliance trends error:', error)
    res.json({ data: [], period: '30 days', totalAnalyses: 0 })
  }
})

router.get('/charts/violation-categories', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000'

    // Get violations by category and severity
    const { data: violations, error } = await supabase
      .from('violations')
      .select(`
        id,
        category,
        severity,
        analysis_result_id,
        analysis_results!inner (
          user_id
        )
      `)
      .eq('analysis_results.user_id', userId)

    if (error) {
      throw new Error('Failed to fetch violation categories')
    }

    // Group by category and severity
    const categoryData: { [key: string]: { [severity: string]: number } } = {}
    
    violations?.forEach(violation => {
      const category = violation.category || 'Other'
      const severity = violation.severity || 'low'
      
      if (!categoryData[category]) {
        categoryData[category] = { critical: 0, high: 0, medium: 0, low: 0 }
      }
      categoryData[category][severity]++
    })

    // Format for pie chart
    const pieChartData = Object.entries(categoryData).map(([category, severities]) => ({
      category,
      total: Object.values(severities).reduce((sum, count) => sum + count, 0),
      critical: severities.critical,
      high: severities.high,
      medium: severities.medium,
      low: severities.low
    })).sort((a, b) => b.total - a.total)

    // Also provide severity breakdown
    const severityTotals = {
      critical: violations?.filter(v => v.severity === 'critical').length || 0,
      high: violations?.filter(v => v.severity === 'high').length || 0,
      medium: violations?.filter(v => v.severity === 'medium').length || 0,
      low: violations?.filter(v => v.severity === 'low').length || 0
    }

    res.json({
      byCategory: pieChartData,
      bySeverity: severityTotals,
      totalViolations: violations?.length || 0
    })
  } catch (error) {
    console.error('Violation categories error:', error)
    res.json({ byCategory: [], bySeverity: { critical: 0, high: 0, medium: 0, low: 0 }, totalViolations: 0 })
  }
})

router.get('/charts/document-processing', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000'
    const days = parseInt(req.query.days as string) || 30

    // Get document processing data over time
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        type,
        status,
        size,
        created_at,
        analysis_results (
          processing_time_ms,
          overall_status
        )
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error('Failed to fetch document processing data')
    }

    // Group by day for timeline chart
    const dailyProcessing: { [key: string]: { uploaded: number; processed: number; errors: number } } = {}
    
    documents?.forEach(doc => {
      const date = new Date(doc.created_at).toISOString().split('T')[0]
      if (!dailyProcessing[date]) {
        dailyProcessing[date] = { uploaded: 0, processed: 0, errors: 0 }
      }
      
      dailyProcessing[date].uploaded++
      
      if (doc.status === 'analyzed') {
        dailyProcessing[date].processed++
      } else if (doc.status === 'error') {
        dailyProcessing[date].errors++
      }
    })

    const timelineData = Object.entries(dailyProcessing).map(([date, stats]) => ({
      date,
      ...stats
    }))

    // Document type breakdown
    const typeBreakdown: { [key: string]: number } = {}
    documents?.forEach(doc => {
      const type = doc.type || 'unknown'
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1
    })

    // Processing performance
    const processingTimes = documents
      ?.filter(doc => doc.analysis_results?.[0]?.processing_time_ms)
      .map(doc => doc.analysis_results[0].processing_time_ms || 0) || []
    
    const avgProcessingTime = processingTimes.length > 0 
      ? Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length)
      : 0

    res.json({
      timeline: timelineData,
      byType: Object.entries(typeBreakdown).map(([type, count]) => ({ type, count })),
      performance: {
        averageProcessingTime: avgProcessingTime,
        totalDocuments: documents?.length || 0,
        processedDocuments: documents?.filter(d => d.status === 'analyzed').length || 0,
        errorRate: documents?.length ? 
          (documents.filter(d => d.status === 'error').length / documents.length * 100).toFixed(1) + '%' : '0%'
      }
    })
  } catch (error) {
    console.error('Document processing error:', error)
    res.json({ 
      timeline: [], 
      byType: [], 
      performance: { averageProcessingTime: 0, totalDocuments: 0, processedDocuments: 0, errorRate: '0%' } 
    })
  }
})

router.get('/charts/performance-metrics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id || '123e4567-e89b-12d3-a456-426614174000'
    const hours = parseInt(req.query.hours as string) || 24

    // Get recent analyses for performance metrics
    const { data: recentAnalyses, error } = await supabase
      .from('analysis_results')
      .select('processing_time_ms, tokens_used, confidence, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error('Failed to fetch performance metrics')
    }

    // Group by hour for performance timeline
    const hourlyMetrics: { [key: string]: { times: number[]; tokens: number[]; confidences: number[] } } = {}
    
    recentAnalyses?.forEach(analysis => {
      const hour = new Date(analysis.created_at).toISOString().split('T')[1].split(':')[0]
      const hourKey = `${hour}:00`
      
      if (!hourlyMetrics[hourKey]) {
        hourlyMetrics[hourKey] = { times: [], tokens: [], confidences: [] }
      }
      
      if (analysis.processing_time_ms) hourlyMetrics[hourKey].times.push(analysis.processing_time_ms)
      if (analysis.tokens_used) hourlyMetrics[hourKey].tokens.push(analysis.tokens_used)
      if (analysis.confidence) hourlyMetrics[hourKey].confidences.push(analysis.confidence * 100)
    })

    const performanceTimeline = Object.entries(hourlyMetrics).map(([hour, metrics]) => ({
      hour,
      avgProcessingTime: metrics.times.length > 0 ? 
        Math.round(metrics.times.reduce((sum, time) => sum + time, 0) / metrics.times.length) : 0,
      avgTokens: metrics.tokens.length > 0 ?
        Math.round(metrics.tokens.reduce((sum, tokens) => sum + tokens, 0) / metrics.tokens.length) : 0,
      avgConfidence: metrics.confidences.length > 0 ?
        Math.round(metrics.confidences.reduce((sum, conf) => sum + conf, 0) / metrics.confidences.length * 10) / 10 : 0,
      analysesCount: metrics.times.length
    }))

    // Overall performance summary
    const allProcessingTimes = recentAnalyses?.map(a => a.processing_time_ms).filter(Boolean) || []
    const allTokens = recentAnalyses?.map(a => a.tokens_used).filter(Boolean) || []
    const allConfidences = recentAnalyses?.map(a => a.confidence).filter(Boolean) || []

    const summary = {
      totalAnalyses: recentAnalyses?.length || 0,
      avgProcessingTime: allProcessingTimes.length > 0 ?
        Math.round(allProcessingTimes.reduce((sum, time) => sum + time, 0) / allProcessingTimes.length) : 0,
      avgTokensUsed: allTokens.length > 0 ?
        Math.round(allTokens.reduce((sum, tokens) => sum + tokens, 0) / allTokens.length) : 0,
      avgConfidence: allConfidences.length > 0 ?
        Math.round(allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length * 100 * 10) / 10 : 0
    }

    res.json({
      timeline: performanceTimeline,
      summary,
      period: `${hours} hours`
    })
  } catch (error) {
    console.error('Performance metrics error:', error)
    res.json({ 
      timeline: [], 
      summary: { totalAnalyses: 0, avgProcessingTime: 0, avgTokensUsed: 0, avgConfidence: 0 },
      period: '24 hours'
    })
  }
})

export default router