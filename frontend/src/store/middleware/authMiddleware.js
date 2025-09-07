import { logout, refreshToken, updateActivity } from '../slices/authSlice'
import { apiService } from '../../services/apiService'

/**
 * Authentication middleware for Redux
 * Handles token expiration, session management, and automatic token refresh
 */
export const authMiddleware = (store) => (next) => (action) => {
  const state = store.getState()
  const { auth } = state
  
  // Update user activity on any action (except auth actions to avoid infinite loop)
  if (!action.type.startsWith('auth/') && auth.isAuthenticated) {
    store.dispatch(updateActivity())
  }
  
  // Check for token expiration before processing non-auth actions
  if (auth.token && auth.tokenExpiry && !action.type.startsWith('auth/')) {
    const expiryTime = new Date(auth.tokenExpiry).getTime()
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime
    
    // If token expires in less than 5 minutes, try to refresh
    if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
      store.dispatch(refreshToken())
    }
    // If token is already expired, logout
    else if (timeUntilExpiry <= 0) {
      store.dispatch(logout())
      return next(action)
    }
  }
  
  // Check for session timeout
  if (auth.isAuthenticated && auth.lastActivity) {
    const lastActivityTime = new Date(auth.lastActivity).getTime()
    const sessionTimeout = auth.sessionTimeout || 30 * 60 * 1000 // 30 minutes default
    const timeSinceActivity = Date.now() - lastActivityTime
    
    if (timeSinceActivity > sessionTimeout) {
      store.dispatch(logout())
      // Show session timeout notification
      store.dispatch({
        type: 'ui/showNotification',
        payload: {
          type: 'warning',
          message: 'Your session has expired due to inactivity. Please log in again.',
          persistent: true
        }
      })
      return next(action)
    }
  }
  
  return next(action)
}

/**
 * Token refresh middleware
 * Automatically handles token refresh logic
 */
export const tokenRefreshMiddleware = (store) => (next) => (action) => {
  // Handle successful token refresh
  if (action.type === 'auth/refreshToken/fulfilled') {
    const { token, expiresAt } = action.payload
    
    // Update API service with new token
    apiService.setAuthToken(token)
    
    // Schedule next refresh (15 minutes before expiry)
    const expiryTime = new Date(expiresAt).getTime()
    const refreshTime = expiryTime - (15 * 60 * 1000)
    const timeUntilRefresh = refreshTime - Date.now()
    
    if (timeUntilRefresh > 0) {
      setTimeout(() => {
        const currentState = store.getState()
        if (currentState.auth.isAuthenticated) {
          store.dispatch(refreshToken())
        }
      }, timeUntilRefresh)
    }
  }
  
  // Handle failed token refresh
  if (action.type === 'auth/refreshToken/rejected') {
    // Clear invalid token and logout
    store.dispatch(logout())
    
    // Redirect to login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?expired=true'
    }
  }
  
  // Handle login success
  if (action.type === 'auth/loginUser/fulfilled') {
    const { token, expiresAt } = action.payload
    
    // Update API service with new token
    apiService.setAuthToken(token)
    
    // Schedule token refresh
    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime()
      const refreshTime = expiryTime - (15 * 60 * 1000)
      const timeUntilRefresh = refreshTime - Date.now()
      
      if (timeUntilRefresh > 0) {
        setTimeout(() => {
          const currentState = store.getState()
          if (currentState.auth.isAuthenticated) {
            store.dispatch(refreshToken())
          }
        }, timeUntilRefresh)
      }
    }
  }
  
  // Handle logout
  if (action.type === 'auth/logout') {
    // Clear API service token
    apiService.clearAuthToken()
    
    // Clear any pending refresh timeouts
    // Note: In a real implementation, you'd want to track timeout IDs
    // and clear them properly
  }
  
  return next(action)
}

/**
 * Permission middleware
 * Checks user permissions for certain actions
 */
export const permissionMiddleware = (store) => (next) => (action) => {
  const state = store.getState()
  const { auth } = state
  
  // Define protected actions and required roles
  const protectedActions = {
    'documents/batchDeleteDocuments': ['admin'],
    'analysis/batchAnalyzeDocuments': ['admin', 'user'],
    'violations/batchUpdateViolations': ['admin'],
    'dashboard/exportSystemReport': ['admin']
  }
  
  // Check if action requires permission
  const requiredRoles = protectedActions[action.type]
  if (requiredRoles && auth.user) {
    const userRole = auth.user.role
    
    if (!requiredRoles.includes(userRole)) {
      // Dispatch unauthorized action
      store.dispatch({
        type: 'ui/showNotification',
        payload: {
          type: 'error',
          message: 'You do not have permission to perform this action.',
          duration: 5000
        }
      })
      
      // Don't process the action
      return { 
        type: 'UNAUTHORIZED_ACTION',
        originalAction: action,
        error: 'Insufficient permissions'
      }
    }
  }
  
  return next(action)
}

/**
 * Activity tracking middleware
 * Tracks user actions for analytics and session management
 */
export const activityTrackingMiddleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // Track significant user actions
  const trackableActions = [
    'documents/uploadDocument/fulfilled',
    'analysis/analyzeDocument/fulfilled',
    'violations/updateViolationStatus',
    'documents/deleteDocument/fulfilled'
  ]
  
  if (trackableActions.includes(action.type)) {
    const state = store.getState()
    const { auth } = state
    
    if (auth.isAuthenticated && auth.user) {
      // Log activity (in a real app, this might send to analytics service)
      const activityData = {
        userId: auth.user.id,
        action: action.type,
        timestamp: new Date().toISOString(),
        metadata: {
          documentId: action.payload?.id || action.meta?.arg,
          userAgent: navigator.userAgent,
          path: window.location.pathname
        }
      }
      
      // Store in dashboard activity feed
      store.dispatch({
        type: 'dashboard/addActivityItem',
        payload: {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: getActivityType(action.type),
          title: getActivityTitle(action.type, action.payload),
          timestamp: new Date().toISOString(),
          userId: auth.user.id,
          metadata: activityData.metadata
        }
      })
      
      // Send to analytics service (placeholder)
      if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
        // analyticsService.track(activityData)
      }
    }
  }
  
  return result
}

// Helper functions for activity tracking
function getActivityType(actionType) {
  const typeMap = {
    'documents/uploadDocument/fulfilled': 'document_uploaded',
    'analysis/analyzeDocument/fulfilled': 'analysis_completed',
    'violations/updateViolationStatus': 'violation_updated',
    'documents/deleteDocument/fulfilled': 'document_deleted'
  }
  
  return typeMap[actionType] || 'user_action'
}

function getActivityTitle(actionType, payload) {
  const titleMap = {
    'documents/uploadDocument/fulfilled': `Uploaded document: ${payload?.name || 'Unknown'}`,
    'analysis/analyzeDocument/fulfilled': `Analyzed document for compliance`,
    'violations/updateViolationStatus': `Updated violation status`,
    'documents/deleteDocument/fulfilled': `Deleted document`
  }
  
  return titleMap[actionType] || 'User performed an action'
}

/**
 * Combined auth middleware
 * Combines all auth-related middleware
 */
export const combinedAuthMiddleware = [
  authMiddleware,
  tokenRefreshMiddleware,
  permissionMiddleware,
  activityTrackingMiddleware
]

export default authMiddleware