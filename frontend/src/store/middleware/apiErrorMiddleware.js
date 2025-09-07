/**
 * API Error Handling Middleware
 * Handles API errors globally and provides user-friendly notifications
 */
export const apiErrorMiddleware = (store) => (next) => (action) => {
  // Handle rejected async thunk actions
  if (action.type.endsWith('/rejected')) {
    const error = action.payload || action.error
    
    // Extract service name from action type
    const serviceName = action.type.split('/')[0]
    
    // Handle different types of errors
    handleApiError(store, error, serviceName, action.type)
  }
  
  return next(action)
}

/**
 * Handle API errors and dispatch appropriate notifications
 */
function handleApiError(store, error, serviceName, actionType) {
  const errorInfo = normalizeError(error)
  
  // Don't show notifications for certain errors
  const silentErrors = [
    'auth/loginUser/rejected', // Login errors are handled in UI
    'auth/refreshToken/rejected' // Token refresh errors are handled in auth middleware
  ]
  
  if (silentErrors.includes(actionType)) {
    return
  }
  
  // Determine notification type and message
  const notification = getErrorNotification(errorInfo, serviceName, actionType)
  
  // Dispatch notification
  store.dispatch({
    type: 'ui/showNotification',
    payload: notification
  })
  
  // Log error for debugging
  if (import.meta.env.MODE === 'development') {
    console.error(`API Error [${serviceName}]:`, {
      actionType,
      error: errorInfo,
      timestamp: new Date().toISOString()
    })
  }
  
  // Track error for analytics (in production)
  if (import.meta.env.MODE === 'production') {
    trackError(errorInfo, serviceName, actionType)
  }
}

/**
 * Normalize error object to consistent format
 */
function normalizeError(error) {
  if (typeof error === 'string') {
    return {
      message: error,
      status: null,
      code: null
    }
  }
  
  if (error && typeof error === 'object') {
    return {
      message: error.message || 'An unexpected error occurred',
      status: error.status || error.code || null,
      code: error.code || error.type || null,
      details: error.details || error.data || null
    }
  }
  
  return {
    message: 'An unexpected error occurred',
    status: null,
    code: null
  }
}

/**
 * Generate appropriate notification for error
 */
function getErrorNotification(error, serviceName, actionType) {
  const baseNotification = {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'error',
    timestamp: new Date().toISOString(),
    persistent: false,
    duration: 8000
  }
  
  // Handle specific error statuses
  switch (error.status) {
    case 400:
      return {
        ...baseNotification,
        title: 'Invalid Request',
        message: error.message || 'The request contains invalid data. Please check your input and try again.',
        duration: 6000
      }
      
    case 401:
      return {
        ...baseNotification,
        title: 'Authentication Required',
        message: 'Please log in to continue.',
        persistent: true,
        actions: [{
          text: 'Login',
          action: () => window.location.href = '/login'
        }]
      }
      
    case 403:
      return {
        ...baseNotification,
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        duration: 5000
      }
      
    case 404:
      return {
        ...baseNotification,
        title: 'Not Found',
        message: getNotFoundMessage(serviceName),
        duration: 5000
      }
      
    case 409:
      return {
        ...baseNotification,
        title: 'Conflict',
        message: error.message || 'This action conflicts with existing data. Please refresh and try again.',
        duration: 6000
      }
      
    case 422:
      return {
        ...baseNotification,
        title: 'Validation Error',
        message: error.message || 'Please check your input and correct any validation errors.',
        duration: 6000
      }
      
    case 429:
      return {
        ...baseNotification,
        title: 'Rate Limited',
        message: 'Too many requests. Please wait a moment before trying again.',
        type: 'warning',
        duration: 5000
      }
      
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        ...baseNotification,
        title: 'Server Error',
        message: 'A server error occurred. Our team has been notified. Please try again later.',
        duration: 8000,
        actions: [{
          text: 'Retry',
          action: () => window.location.reload()
        }]
      }
      
    case 0:
    case null:
      return {
        ...baseNotification,
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        type: 'warning',
        duration: 6000,
        actions: [{
          text: 'Retry',
          action: () => window.location.reload()
        }]
      }
      
    default:
      return {
        ...baseNotification,
        title: getGenericErrorTitle(serviceName, actionType),
        message: error.message || 'An unexpected error occurred. Please try again.',
        duration: 6000
      }
  }
}

/**
 * Get service-specific not found message
 */
function getNotFoundMessage(serviceName) {
  const messages = {
    documents: 'The requested document was not found. It may have been deleted.',
    analysis: 'The analysis results were not found. The analysis may still be processing.',
    violations: 'The violation details were not found.',
    dashboard: 'The dashboard data is currently unavailable.',
    auth: 'User account not found.'
  }
  
  return messages[serviceName] || 'The requested resource was not found.'
}

/**
 * Get generic error title based on service and action
 */
function getGenericErrorTitle(serviceName, actionType) {
  // Extract operation from action type
  const operation = actionType.split('/')[1]
  
  const operationTitles = {
    uploadDocument: 'Upload Failed',
    fetchDocuments: 'Loading Failed',
    deleteDocument: 'Delete Failed',
    analyzeDocument: 'Analysis Failed',
    fetchAnalysisResults: 'Results Loading Failed',
    loginUser: 'Login Failed',
    registerUser: 'Registration Failed',
    updateUserProfile: 'Profile Update Failed'
  }
  
  return operationTitles[operation] || 'Operation Failed'
}

/**
 * Track error for analytics (placeholder implementation)
 */
function trackError(error, serviceName, actionType) {
  // In a real application, this would send error data to an analytics service
  const errorData = {
    message: error.message,
    status: error.status,
    code: error.code,
    service: serviceName,
    action: actionType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: null // Would be populated from store state
  }
  
  // Example: Send to error tracking service
  // errorTrackingService.captureException(errorData)
  
  console.warn('Error tracked:', errorData)
}

/**
 * Retry middleware - handles automatic retries for failed requests
 */
export const retryMiddleware = (store) => (next) => (action) => {
  // Handle retry actions
  if (action.type.endsWith('/retry')) {
    const originalActionType = action.type.replace('/retry', '')
    const retryCount = action.meta?.retryCount || 0
    const maxRetries = action.meta?.maxRetries || 3
    
    if (retryCount < maxRetries) {
      // Dispatch original action with retry metadata
      const retryAction = {
        ...action.payload.originalAction,
        meta: {
          ...action.payload.originalAction.meta,
          retryCount: retryCount + 1,
          maxRetries
        }
      }
      
      // Add exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
      
      setTimeout(() => {
        store.dispatch(retryAction)
      }, delay)
      
      // Show retry notification
      store.dispatch({
        type: 'ui/showNotification',
        payload: {
          id: `retry_${Date.now()}`,
          type: 'info',
          message: `Retrying operation... (Attempt ${retryCount + 1}/${maxRetries})`,
          duration: 3000
        }
      })
    } else {
      // Max retries exceeded
      store.dispatch({
        type: 'ui/showNotification',
        payload: {
          id: `retry_failed_${Date.now()}`,
          type: 'error',
          title: 'Operation Failed',
          message: 'Maximum retry attempts exceeded. Please try again later.',
          duration: 8000
        }
      })
    }
    
    return next(action)
  }
  
  return next(action)
}

/**
 * Combined error handling middleware
 */
export const combinedErrorMiddleware = [
  apiErrorMiddleware,
  retryMiddleware
]

export default apiErrorMiddleware