import axios from 'axios'

// ================================
// API Configuration
// ================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// ================================
// Request/Response Interceptors
// ================================

// Request interceptor - Add auth token (TEMPORARILY DISABLED FOR TESTING)
api.interceptors.request.use(
  (config) => {
    // TEMPORARILY COMMENTED OUT FOR TESTING - NO AUTH TOKEN SENT
    // const token = localStorage.getItem('authToken')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    
    // Add request ID for tracking
    config.metadata = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now()
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 [${config.metadata.requestId}] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      })
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    const { config } = response
    
    // Log response in development
    if (import.meta.env.DEV) {
      const duration = Date.now() - config.metadata.startTime
      console.log(`✅ [${config.metadata.requestId}] ${response.status} ${response.config.url} (${duration}ms)`)
    }
    
    return response
  },
  async (error) => {
    const { config, response } = error
    
    // Log error in development
    if (import.meta.env.DEV) {
      const duration = Date.now() - (config?.metadata?.startTime || Date.now())
      console.error(`❌ [${config?.metadata?.requestId}] ${response?.status || 'Network Error'} ${config?.url} (${duration}ms)`, error)
    }
    
    // TEMPORARILY DISABLED FOR TESTING - Handle token expiration
    // if (response?.status === 401 && config && !config._retry) {
    //   config._retry = true
    //   
    //   // Clear stored auth data
    //   localStorage.removeItem('authToken')
    //   localStorage.removeItem('tokenExpiry')
    //   
    //   // Redirect to login if not already there
    //   if (!window.location.pathname.includes('/login')) {
    //     window.location.href = '/login'
    //   }
    //   
    //   return Promise.reject({
    //     ...error,
    //     message: 'Your session has expired. Please log in again.'
    //   })
    // }
    
    // Handle rate limiting
    if (response?.status === 429) {
      const retryAfter = response.headers['retry-after'] || 1
      
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(api.request(config))
        }, retryAfter * 1000)
      })
    }
    
    // Handle network errors
    if (!response) {
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection.'
      })
    }
    
    // Handle server errors
    if (response.status >= 500) {
      return Promise.reject({
        ...error,
        message: response.data?.message || 'Server error. Please try again later.'
      })
    }
    
    // Handle client errors
    if (response.status >= 400) {
      return Promise.reject({
        ...error,
        message: response.data?.message || `Request failed with status ${response.status}`
      })
    }
    
    return Promise.reject(error)
  }
)

// ================================
// API Service Class
// ================================

class ApiService {
  constructor() {
    this.cancelTokens = new Map()
  }
  
  // Set authentication token
  setAuthToken(token) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('authToken', token)
    } else {
      delete api.defaults.headers.common['Authorization']
      localStorage.removeItem('authToken')
    }
  }
  
  // Clear authentication token
  clearAuthToken() {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('authToken')
    localStorage.removeItem('tokenExpiry')
  }
  
  // Cancel request
  cancelRequest(requestKey) {
    const cancelToken = this.cancelTokens.get(requestKey)
    if (cancelToken) {
      cancelToken.cancel('Request cancelled by user')
      this.cancelTokens.delete(requestKey)
    }
  }
  
  // Cancel all pending requests
  cancelAllRequests() {
    this.cancelTokens.forEach((cancelToken, key) => {
      cancelToken.cancel('All requests cancelled')
    })
    this.cancelTokens.clear()
  }
  
  // Generic GET request
  async get(url, config = {}) {
    try {
      const response = await api.get(url, config)
      return response
    } catch (error) {
      throw this.normalizeError(error)
    }
  }
  
  // Generic POST request
  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config)
      return response
    } catch (error) {
      throw this.normalizeError(error)
    }
  }
  
  // Generic PUT request
  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config)
      return response
    } catch (error) {
      throw this.normalizeError(error)
    }
  }
  
  // Generic PATCH request
  async patch(url, data = {}, config = {}) {
    try {
      const response = await api.patch(url, data, config)
      return response
    } catch (error) {
      throw this.normalizeError(error)
    }
  }
  
  // Generic DELETE request
  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config)
      return response
    } catch (error) {
      throw this.normalizeError(error)
    }
  }
  
  // Upload file with progress tracking
  async uploadFile(url, file, options = {}) {
    const formData = new FormData()
    formData.append('document', file)
    
    if (options.metadata) {
      Object.keys(options.metadata).forEach(key => {
        formData.append(key, options.metadata[key])
      })
    }
    
    const config = {
      headers: {
        // Don't manually set Content-Type for multipart/form-data
        // Let axios set it automatically with proper boundary
      },
      onUploadProgress: options.onProgress,
      timeout: options.timeout || 300000, // 5 minute timeout for uploads
      ...options.config
    }
    
    // Add cancel token if requestKey provided
    if (options.requestKey) {
      const cancelToken = axios.CancelToken.source()
      this.cancelTokens.set(options.requestKey, cancelToken)
      config.cancelToken = cancelToken.token
    }
    
    try {
      const response = await api.post(url, formData, config)
      
      // Clean up cancel token
      if (options.requestKey) {
        this.cancelTokens.delete(options.requestKey)
      }
      
      return response
    } catch (error) {
      // Clean up cancel token on error
      if (options.requestKey) {
        this.cancelTokens.delete(options.requestKey)
      }
      
      throw this.normalizeError(error)
    }
  }
  
  // Batch request (execute multiple requests concurrently)
  async batchRequest(requests, options = {}) {
    const { maxConcurrent = 5, stopOnError = false } = options
    
    const results = []
    const errors = []
    
    // Process requests in batches
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          const response = await this[request.method](request.url, request.data, request.config)
          return { index: i + index, response, success: true }
        } catch (error) {
          const result = { index: i + index, error, success: false }
          
          if (stopOnError) {
            throw result
          }
          
          return result
        }
      })
      
      try {
        const batchResults = await Promise.all(batchPromises)
        
        batchResults.forEach(result => {
          if (result.success) {
            results[result.index] = result.response
          } else {
            errors[result.index] = result.error
          }
        })
      } catch (error) {
        // Handle stopOnError case
        return { results, errors: [error] }
      }
    }
    
    return { results, errors }
  }
  
  // Retry failed request with exponential backoff
  async retryRequest(requestFn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2
    } = options
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        // Don't retry on client errors (4xx) except 408, 429
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (![408, 429].includes(error.response.status)) {
            throw error
          }
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        )
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay * (0.5 + Math.random() * 0.5)
        
        await new Promise(resolve => setTimeout(resolve, jitteredDelay))
      }
    }
  }
  
  // Normalize error response
  normalizeError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data,
        code: error.response.data?.code || error.code
      }
    } else if (error.request) {
      // Network error
      return {
        status: 0,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      }
    } else {
      // Request setup error
      return {
        status: -1,
        message: error.message || 'Request failed',
        code: 'REQUEST_ERROR'
      }
    }
  }
  
  // Get request health/status
  getHealthStatus() {
    return this.get('/health')
      .then(() => ({ status: 'healthy', timestamp: new Date().toISOString() }))
      .catch((error) => ({ 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      }))
  }
}

// ================================
// Specific API Endpoints
// ================================

class ComplianceApiService extends ApiService {
  // Authentication endpoints
  async login(credentials) {
    return this.post('/auth/login', credentials)
  }
  
  async register(userData) {
    return this.post('/auth/register', userData)
  }
  
  async logout() {
    return this.post('/auth/logout')
  }
  
  async refreshToken() {
    return this.post('/auth/refresh')
  }
  
  async getUserProfile() {
    return this.get('/auth/profile')
  }
  
  async updateProfile(updates) {
    return this.put('/auth/profile', updates)
  }
  
  // Document endpoints
  async uploadDocument(file, options = {}) {
    return this.uploadFile('/documents/upload', file, {
      requestKey: `upload_${file.name}_${Date.now()}`,
      ...options
    })
  }
  
  async getDocuments(params = {}) {
    return this.get('/documents', { params })
  }
  
  async getDocument(id) {
    return this.get(`/documents/${id}`)
  }
  
  async deleteDocument(id) {
    return this.delete(`/documents/${id}`)
  }
  
  async batchDeleteDocuments(ids) {
    return this.post('/documents/batch-delete', { documentIds: ids })
  }
  
  async searchDocuments(query, filters = {}) {
    return this.get('/documents/search', { 
      params: { q: query, ...filters } 
    })
  }
  
  // Analysis endpoints
  async analyzeDocument(documentId, options = {}) {
    return this.post(`/analysis/documents/${documentId}/analyze`, options)
  }
  
  async getAnalysisResults(documentId) {
    return this.get(`/analysis/documents/${documentId}/results`)
  }

  async getAnalysisStatus(documentId) {
    return this.get(`/analysis/documents/${documentId}/status`)
  }
  
  async getAllAnalysisResults(params = {}) {
    return this.get('/analysis/results', { params })
  }
  
  async batchAnalyzeDocuments(documentIds, options = {}) {
    return this.post('/batch/analyze', { documentIds, ...options })
  }
  
  // Dashboard endpoints
  async getDashboardStats() {
    return this.get('/dashboard/stats')
  }
  
  async getDashboardDocuments(params = {}) {
    return this.get('/dashboard/documents', { params })
  }
  
  async getDashboardAnalyses(params = {}) {
    return this.get('/dashboard/analyses', { params })
  }
  
  async getRecentActivity(params = {}) {
    return this.get('/dashboard/activity', { params })
  }
  
  async getAlerts() {
    return this.get('/dashboard/alerts')
  }
  
  async acknowledgeAlert(alertId) {
    return this.patch(`/dashboard/alerts/${alertId}`, { acknowledged: true })
  }
  
  // Chart data endpoints
  async getComplianceTrends(days = 30) {
    return this.get('/dashboard/charts/compliance-trends', { params: { days } })
  }
  
  async getViolationCategories() {
    return this.get('/dashboard/charts/violation-categories')
  }
  
  async getDocumentProcessingData(days = 30) {
    return this.get('/dashboard/charts/document-processing', { params: { days } })
  }
  
  async getPerformanceMetrics(hours = 24) {
    return this.get('/dashboard/charts/performance-metrics', { params: { hours } })
  }
  
  // Violation endpoints  
  async updateViolationStatus(violationId, status) {
    return this.patch(`/violations/${violationId}`, { status })
  }
  
  async addViolationNote(violationId, note) {
    return this.post(`/violations/${violationId}/notes`, { note })
  }
  
  async applyRemediation(violationId, remediationId) {
    return this.post(`/violations/${violationId}/remediation/${remediationId}/apply`)
  }
  
  // Export endpoints
  async exportAnalysisReport(documentId, format = 'pdf') {
    return this.get(`/reports/analysis/${documentId}`, { 
      params: { format }
    })
  }

  async exportViolationReport(filters = {}, format = 'pdf') {
    return this.get('/reports/violations', {
      params: { ...filters, format }
    })
  }
  
  // Generate PDF report
  async generatePDFReport(reportData) {
    // This would typically call a PDF generation service
    // For MVP, we'll return the data that would be used to generate a PDF
    return reportData;
  }
}

// Create and export singleton instance
export const apiService = new ComplianceApiService()

// Initialize auth token from localStorage
const token = localStorage.getItem('authToken')
if (token) {
  apiService.setAuthToken(token)
}

export default apiService