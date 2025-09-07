import { useSelector, useDispatch } from 'react-redux'
import { useCallback, useMemo } from 'react'

// ================================
// Authentication Hooks
// ================================

export const useAuth = () => {
  const dispatch = useDispatch()
  const auth = useSelector(state => state.auth)
  
  const login = useCallback((credentials) => {
    return dispatch({ type: 'auth/loginUser', payload: credentials })
  }, [dispatch])
  
  const logout = useCallback(() => {
    dispatch({ type: 'auth/logout' })
  }, [dispatch])
  
  const register = useCallback((userData) => {
    return dispatch({ type: 'auth/registerUser', payload: userData })
  }, [dispatch])
  
  const updateProfile = useCallback((updates) => {
    return dispatch({ type: 'auth/updateUserProfile', payload: updates })
  }, [dispatch])
  
  return {
    ...auth,
    actions: {
      login,
      logout,
      register,
      updateProfile
    }
  }
}

export const useUser = () => {
  const user = useSelector(state => state.auth.user)
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated)
  const isLoading = useSelector(state => state.auth.isLoading)
  
  return {
    user,
    isAuthenticated,
    isLoading,
    role: user?.role,
    permissions: user?.permissions || [],
    preferences: user?.preferences || {}
  }
}

// ================================
// Document Hooks
// ================================

export const useDocuments = () => {
  const dispatch = useDispatch()
  const documents = useSelector(state => state.documents)
  
  const uploadDocument = useCallback((file, options = {}) => {
    return dispatch({
      type: 'documents/uploadDocument',
      payload: { file, ...options }
    })
  }, [dispatch])
  
  const fetchDocuments = useCallback((params = {}) => {
    return dispatch({
      type: 'documents/fetchDocuments',
      payload: params
    })
  }, [dispatch])
  
  const deleteDocument = useCallback((documentId) => {
    return dispatch({
      type: 'documents/deleteDocument',
      payload: documentId
    })
  }, [dispatch])
  
  const selectDocument = useCallback((documentId) => {
    dispatch({
      type: 'documents/selectDocument',
      payload: documentId
    })
  }, [dispatch])
  
  const setFilters = useCallback((filters) => {
    dispatch({
      type: 'documents/setFilters',
      payload: filters
    })
  }, [dispatch])
  
  const setSorting = useCallback((sortBy, sortOrder) => {
    dispatch({
      type: 'documents/setSorting',
      payload: { sortBy, sortOrder }
    })
  }, [dispatch])
  
  return {
    ...documents,
    actions: {
      uploadDocument,
      fetchDocuments,
      deleteDocument,
      selectDocument,
      setFilters,
      setSorting
    }
  }
}

export const useDocumentUpload = () => {
  const uploadQueue = useSelector(state => state.documents.uploadQueue)
  const dispatch = useDispatch()
  
  const activeUploads = useMemo(() => 
    uploadQueue.filter(upload => 
      upload.status === 'uploading' || upload.status === 'processing'
    ),
    [uploadQueue]
  )
  
  const completedUploads = useMemo(() =>
    uploadQueue.filter(upload => upload.status === 'completed'),
    [uploadQueue]
  )
  
  const failedUploads = useMemo(() =>
    uploadQueue.filter(upload => upload.status === 'error'),
    [uploadQueue]
  )
  
  const clearQueue = useCallback(() => {
    dispatch({ type: 'documents/clearUploadQueue' })
  }, [dispatch])
  
  const retryUpload = useCallback((fileId) => {
    const upload = uploadQueue.find(u => u.fileId === fileId)
    if (upload) {
      dispatch({
        type: 'documents/uploadDocument',
        payload: { file: upload.file }
      })
    }
  }, [dispatch, uploadQueue])
  
  return {
    uploadQueue,
    activeUploads,
    completedUploads,
    failedUploads,
    actions: {
      clearQueue,
      retryUpload
    }
  }
}

// ================================
// Analysis Hooks
// ================================

export const useAnalysis = () => {
  const dispatch = useDispatch()
  const analysis = useSelector(state => state.analysis)
  
  const analyzeDocument = useCallback((documentId, options = {}) => {
    return dispatch({
      type: 'analysis/analyzeDocument',
      payload: { documentId, ...options }
    })
  }, [dispatch])
  
  const fetchAnalysisResults = useCallback((documentId) => {
    return dispatch({
      type: 'analysis/fetchAnalysisResults',
      payload: documentId
    })
  }, [dispatch])
  
  const batchAnalyze = useCallback((documentIds, options = {}) => {
    return dispatch({
      type: 'analysis/batchAnalyzeDocuments',
      payload: { documentIds, ...options }
    })
  }, [dispatch])
  
  return {
    ...analysis,
    actions: {
      analyzeDocument,
      fetchAnalysisResults,
      batchAnalyze
    }
  }
}

// ================================
// Violations Hooks
// ================================

export const useViolations = () => {
  const dispatch = useDispatch()
  const violations = useSelector(state => state.violations)
  
  const updateViolationStatus = useCallback((violationId, status) => {
    return dispatch({
      type: 'violations/updateViolationStatus',
      payload: { violationId, status }
    })
  }, [dispatch])
  
  const selectViolation = useCallback((violationId) => {
    dispatch({
      type: 'violations/selectViolation',
      payload: violationId
    })
  }, [dispatch])
  
  const setFilters = useCallback((filters) => {
    dispatch({
      type: 'violations/setFilters',
      payload: filters
    })
  }, [dispatch])
  
  const applyRemediation = useCallback((violationId, remediationId) => {
    return dispatch({
      type: 'violations/applyRemediation',
      payload: { violationId, remediationId }
    })
  }, [dispatch])
  
  return {
    ...violations,
    actions: {
      updateViolationStatus,
      selectViolation,
      setFilters,
      applyRemediation
    }
  }
}

export const useSelectedViolation = () => {
  const selectedViolationId = useSelector(state => state.violations.selectedViolation)
  const selectedViolation = useSelector(state => 
    selectedViolationId ? state.violations.entities[selectedViolationId] : null
  )
  
  return selectedViolation
}

// ================================
// Dashboard Hooks
// ================================

export const useDashboard = () => {
  const dispatch = useDispatch()
  const dashboard = useSelector(state => state.dashboard)
  
  const fetchMetrics = useCallback(() => {
    return dispatch({ type: 'dashboard/fetchMetrics' })
  }, [dispatch])
  
  const fetchRecentActivity = useCallback(() => {
    return dispatch({ type: 'dashboard/fetchRecentActivity' })
  }, [dispatch])
  
  const acknowledgeAlert = useCallback((alertId) => {
    return dispatch({
      type: 'dashboard/acknowledgeAlert',
      payload: alertId
    })
  }, [dispatch])
  
  return {
    ...dashboard,
    actions: {
      fetchMetrics,
      fetchRecentActivity,
      acknowledgeAlert
    }
  }
}

// ================================
// UI State Hooks
// ================================

export const useUI = () => {
  const dispatch = useDispatch()
  const ui = useSelector(state => state.ui)
  
  const showNotification = useCallback((notification) => {
    dispatch({
      type: 'ui/showNotification',
      payload: notification
    })
  }, [dispatch])
  
  const hideNotification = useCallback((notificationId) => {
    dispatch({
      type: 'ui/hideNotification',
      payload: notificationId
    })
  }, [dispatch])
  
  const openModal = useCallback((modalName, data = {}) => {
    dispatch({
      type: 'ui/openModal',
      payload: { modalName, data }
    })
  }, [dispatch])
  
  const closeModal = useCallback((modalName) => {
    dispatch({
      type: 'ui/closeModal',
      payload: modalName
    })
  }, [dispatch])
  
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'ui/toggleSidebar' })
  }, [dispatch])
  
  const setTheme = useCallback((theme) => {
    dispatch({
      type: 'ui/setTheme',
      payload: theme
    })
  }, [dispatch])
  
  return {
    ...ui,
    actions: {
      showNotification,
      hideNotification,
      openModal,
      closeModal,
      toggleSidebar,
      setTheme
    }
  }
}

export const useModal = (modalName) => {
  const modal = useSelector(state => state.ui.modals[modalName])
  const dispatch = useDispatch()
  
  const open = useCallback((data = {}) => {
    dispatch({
      type: 'ui/openModal',
      payload: { modalName, data }
    })
  }, [dispatch, modalName])
  
  const close = useCallback(() => {
    dispatch({
      type: 'ui/closeModal',
      payload: modalName
    })
  }, [dispatch, modalName])
  
  return {
    isOpen: modal?.isOpen || false,
    data: modal?.data || {},
    loading: modal?.loading || false,
    error: modal?.error || null,
    actions: { open, close }
  }
}

// ================================
// Compound Hooks (Multiple State Domains)
// ================================

export const useDocumentAnalysis = (documentId) => {
  const document = useSelector(state => 
    state.documents.entities[documentId]
  )
  
  const analysisResults = useSelector(state =>
    Object.values(state.analysis.results).filter(result => 
      result.documentId === documentId
    )
  )
  
  const violations = useSelector(state => 
    state.violations.byDocument[documentId]?.map(violationId => 
      state.violations.entities[violationId]
    ) || []
  )
  
  const isAnalyzing = useSelector(state =>
    state.analysis.processingQueue.some(job => 
      job.documentId === documentId && job.status === 'processing'
    )
  )
  
  return {
    document,
    analysisResults,
    violations,
    isAnalyzing,
    latestResult: analysisResults[0] || null
  }
}

export const useComplianceOverview = () => {
  const documents = useSelector(state => state.documents)
  const analysis = useSelector(state => state.analysis)
  const violations = useSelector(state => state.violations)
  
  const totalDocuments = documents.ids.length
  const analyzedDocuments = Object.keys(analysis.results).length
  const totalViolations = violations.ids.length
  
  const violationsBySeverity = useMemo(() => {
    return violations.ids.reduce((acc, violationId) => {
      const violation = violations.entities[violationId]
      acc[violation.severity] = (acc[violation.severity] || 0) + 1
      return acc
    }, {})
  }, [violations])
  
  const averageComplianceScore = useMemo(() => {
    const results = Object.values(analysis.results)
    if (results.length === 0) return 0
    
    const totalScore = results.reduce((sum, result) => sum + result.complianceScore, 0)
    return Math.round(totalScore / results.length)
  }, [analysis.results])
  
  return {
    totalDocuments,
    analyzedDocuments,
    totalViolations,
    violationsBySeverity,
    averageComplianceScore,
    complianceRate: totalDocuments > 0 ? Math.round((analyzedDocuments / totalDocuments) * 100) : 0
  }
}

// ================================
// Real-time Data Hooks
// ================================

export const useRealtimeUpdates = (enabled = true) => {
  const dispatch = useDispatch()
  
  // Set up real-time polling for dashboard data
  useMemo(() => {
    if (!enabled) return null
    
    const interval = setInterval(() => {
      dispatch({ type: 'dashboard/fetchMetrics' })
      dispatch({ type: 'documents/fetchDocuments', payload: { page: 1 } })
    }, 30000) // Poll every 30 seconds
    
    return () => clearInterval(interval)
  }, [dispatch, enabled])
}

export default {
  useAuth,
  useUser,
  useDocuments,
  useDocumentUpload,
  useAnalysis,
  useViolations,
  useSelectedViolation,
  useDashboard,
  useUI,
  useModal,
  useDocumentAnalysis,
  useComplianceOverview,
  useRealtimeUpdates
}