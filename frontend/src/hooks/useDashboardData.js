import { useState, useEffect, useCallback } from 'react'
import apiService from '../services/apiService'

export const useDashboardData = (options = {}) => {
  const { refreshInterval = 30000, autoRefresh = true } = options

  // State
  const [stats, setStats] = useState(null)
  const [documents, setDocuments] = useState({ data: [], pagination: {} })
  const [analyses, setAnalyses] = useState({ data: [], pagination: {} })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Fetch dashboard statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiService.getDashboardStats()
      setStats(response.data)
      setLastUpdate(new Date().toISOString())
      return response.data
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      throw err
    }
  }, [])

  // Fetch documents data
  const fetchDocuments = useCallback(async (params = {}) => {
    try {
      const response = await apiService.getDashboardDocuments(params)
      setDocuments(response.data)
      return response.data
    } catch (err) {
      console.error('Failed to fetch dashboard documents:', err)
      throw err
    }
  }, [])

  // Fetch analyses data
  const fetchAnalyses = useCallback(async (params = {}) => {
    try {
      const response = await apiService.getDashboardAnalyses(params)
      setAnalyses(response.data)
      return response.data
    } catch (err) {
      console.error('Failed to fetch dashboard analyses:', err)
      throw err
    }
  }, [])

  // Fetch recent activity using dedicated endpoint
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await apiService.getRecentActivity({ limit: 10 })
      setRecentActivity(response.data.data || [])
      return response.data
    } catch (err) {
      console.error('Failed to fetch recent activity:', err)
      // Fallback: generate activity from existing documents and analyses
      const fallbackActivity = [...(documents.data || []), ...(analyses.data || [])]
        .sort((a, b) => new Date(b.updatedAt || b.completedAt || b.uploadedAt) - new Date(a.updatedAt || a.completedAt || a.uploadedAt))
        .slice(0, 10)
        .map(item => ({
          id: item.id,
          type: item.documentId ? 'analysis' : 'upload',
          message: item.documentId 
            ? `Analysis ${item.status} for ${item.filename || 'document'}`
            : `Document "${item.filename}" uploaded`,
          timestamp: item.updatedAt || item.completedAt || item.uploadedAt,
          status: item.status,
          complianceScore: item.complianceScore,
          violationsFound: item.violationsFound,
          icon: 'FileText'
        }))
      setRecentActivity(fallbackActivity)
      return { data: fallbackActivity }
    }
  }, [documents.data, analyses.data])

  // Fetch all dashboard data
  const fetchAllData = useCallback(async (options = {}) => {
    const { silent = false } = options
    
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const [statsData, documentsData, analysesData, activityData] = await Promise.all([
        fetchStats(),
        fetchDocuments(),
        fetchAnalyses(),
        fetchRecentActivity()
      ])

      return {
        stats: statsData,
        documents: documentsData,
        analyses: analysesData,
        activity: activityData
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch dashboard data'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [fetchStats, fetchDocuments, fetchAnalyses, fetchRecentActivity])

  // Refresh data
  const refreshData = useCallback(async (silent = true) => {
    return await fetchAllData({ silent })
  }, [fetchAllData])

  // Initial data fetch
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Auto-refresh with smart interval adjustment
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    // Adjust refresh interval based on activity
    const adjustedInterval = stats?.pendingAnalyses > 0 ? 15000 : refreshInterval // Faster refresh if analyses are pending

    const interval = setInterval(() => {
      refreshData(true) // Silent refresh
    }, adjustedInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshData, stats?.pendingAnalyses])

  // Real-time updates for critical metrics
  const enableRealTimeUpdates = useCallback((callback) => {
    const checkForUpdates = async () => {
      try {
        const newStats = await fetchStats()
        if (stats && newStats) {
          // Notify if there are significant changes
          if (Math.abs(newStats.averageComplianceScore - stats.averageComplianceScore) > 5) {
            callback('compliance_change', { 
              old: stats.averageComplianceScore, 
              new: newStats.averageComplianceScore 
            })
          }
          if (newStats.activeViolations > stats.activeViolations) {
            callback('new_violations', { 
              count: newStats.activeViolations - stats.activeViolations 
            })
          }
          if (newStats.totalDocuments > stats.totalDocuments) {
            callback('new_documents', { 
              count: newStats.totalDocuments - stats.totalDocuments 
            })
          }
        }
      } catch (error) {
        console.warn('Real-time update check failed:', error)
      }
    }

    const realtimeInterval = setInterval(checkForUpdates, 10000) // Check every 10 seconds
    return () => clearInterval(realtimeInterval)
  }, [fetchStats, stats])

  // Computed values
  const dashboardMetrics = stats ? {
    totalDocuments: stats.totalDocuments || 0,
    completedAnalyses: stats.completedAnalyses || 0,
    pendingAnalyses: stats.pendingAnalyses || 0,
    averageComplianceScore: stats.averageComplianceScore || 0,
    activeViolations: stats.activeViolations || 0,
    resolvedViolations: stats.resolvedViolations || 0,
    totalUsers: stats.totalUsers || 0,
    processingTime: stats.processingTime || "0s",
    weeklyTrend: stats.weeklyTrend || {
      documents: 0,
      compliance: 0,
      violations: 0
    }
  } : null


  return {
    // Data
    stats: dashboardMetrics,
    documents: documents.data || [],
    analyses: analyses.data || [],
    recentActivity,
    
    // Status
    loading,
    error,
    lastUpdate,
    
    // Actions
    refreshData,
    fetchStats,
    fetchDocuments,
    fetchAnalyses,
    fetchRecentActivity,
    enableRealTimeUpdates,
    
    // Utils
    clearError: () => setError(null)
  }
}

export default useDashboardData