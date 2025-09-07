// ================================
// Core Types for Redux Store
// ================================

export interface BaseState {
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// ================================
// Authentication Types
// ================================

export interface User {
  id: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  name?: string
  avatar?: string
  preferences?: UserPreferences
  createdAt: string
  lastLoginAt?: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    violations: boolean
    reports: boolean
  }
  language: string
  timezone: string
}

export interface AuthState extends BaseState {
  user: User | null
  token: string | null
  tokenExpiry: string | null
  isAuthenticated: boolean
  loginAttempts: number
  lastActivity: string | null
  sessionTimeout: number
}

// ================================
// Document Types
// ================================

export interface Document {
  id: string
  name: string
  originalName: string
  type: 'pdf' | 'docx' | 'txt' | 'html' | 'markdown' | 'image/jpeg' | 'image/png'
  size: number
  url: string
  status: 'uploaded' | 'processing' | 'analyzed' | 'error'
  extractedText: string | null
  userId: string
  createdAt: string
  updatedAt: string
  fileHash: string | null
  processingStartedAt: string | null
  processingCompletedAt: string | null
  errorMessage: string | null
  metadata?: DocumentMetadata
}

export interface DocumentMetadata {
  pages?: number
  language?: string
  confidence?: number
  processingMethod?: 'ocr' | 'text_extraction'
  ocrEngine?: string
  tags?: string[]
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  errorMessage?: string
  startTime: string
  estimatedTimeRemaining?: number
}

export interface DocumentsState extends BaseState {
  entities: Record<string, Document>
  ids: string[]
  uploadQueue: UploadProgress[]
  selectedDocument: string | null
  filters: {
    status?: Document['status']
    type?: Document['type']
    dateRange?: { start: string; end: string }
    searchQuery?: string
  }
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  sortBy: 'name' | 'createdAt' | 'size' | 'status'
  sortOrder: 'asc' | 'desc'
}

// ================================
// Analysis Types
// ================================

export interface AnalysisResult {
  id: string
  documentId: string
  complianceScore: number
  overallStatus: 'compliant' | 'non_compliant' | 'needs_review'
  aiModelUsed: string
  confidence: number
  userId: string
  createdAt: string
  updatedAt: string
  processingTimeMs: number | null
  tokensUsed: number | null
  costUsd: number | null
  analysisVersion: string | null
  analysisMetadata: AnalysisMetadata
  aiRawResponse: any | null
  violations?: Violation[]
}

export interface AnalysisMetadata {
  totalViolations: number
  violationsBySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }
  categories: string[]
  processingSteps: ProcessingStep[]
  rbiGuidelinesChecked: string[]
  summary: string
}

export interface ProcessingStep {
  step: string
  status: 'completed' | 'failed' | 'skipped'
  duration: number
  details?: any
}

export interface AnalysisState extends BaseState {
  results: Record<string, AnalysisResult>
  processingQueue: ProcessingJob[]
  currentAnalysis: string | null
  batchOperations: BatchOperation[]
  statistics: AnalysisStatistics
  recentAnalyses: string[]
}

export interface ProcessingJob {
  id: string
  documentId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  startTime: string
  estimatedCompletion?: string
  currentStep?: string
  errorMessage?: string
}

export interface BatchOperation {
  id: string
  type: 'analyze' | 'reanalyze' | 'export'
  documentIds: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  results?: any
  createdAt: string
}

export interface AnalysisStatistics {
  totalAnalyses: number
  averageScore: number
  totalViolations: number
  processingTimeStats: {
    average: number
    min: number
    max: number
  }
  costStats: {
    total: number
    average: number
  }
}

// ================================
// Violation Types
// ================================

export interface Violation {
  id: string
  analysisResultId: string
  category: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  suggestion: string | null
  createdAt: string
  ruleId: string | null
  matchedText: string | null
  contextBefore: string | null
  contextAfter: string | null
  lineNumber: number | null
  characterPosition: number | null
  violationMetadata: ViolationMetadata
  remediationOptions: RemediationOption[]
  status?: 'pending' | 'acknowledged' | 'resolved' | 'false_positive'
  assignedTo?: string
  notes?: string[]
}

export interface ViolationMetadata {
  rbiGuideline: string
  section: string
  effectiveDate: string
  applicableTo: string[]
  penalty: string
  potentialImpact: string
  examples?: ComplianceExample[]
}

export interface RemediationOption {
  id: string
  title: string
  description: string
  originalText: string
  suggestedText: string
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  priority: number
  applied?: boolean
  appliedAt?: string
}

export interface ComplianceExample {
  title: string
  description: string
  content: string
  keyPoints: string[]
}

export interface ViolationsState extends BaseState {
  entities: Record<string, Violation>
  ids: string[]
  byDocument: Record<string, string[]>
  byCategory: Record<string, string[]>
  bySeverity: Record<string, string[]>
  selectedViolation: string | null
  filters: ViolationFilters
  bulkActions: BulkAction[]
  remediationHistory: RemediationHistory[]
}

export interface ViolationFilters {
  severity?: Violation['severity'][]
  category?: string[]
  status?: Violation['status'][]
  dateRange?: { start: string; end: string }
  searchQuery?: string
  documentId?: string
}

export interface BulkAction {
  id: string
  type: 'acknowledge' | 'resolve' | 'assign' | 'export'
  violationIds: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  parameters?: any
  createdAt: string
  completedAt?: string
}

export interface RemediationHistory {
  id: string
  violationId: string
  action: 'suggestion_applied' | 'status_changed' | 'note_added'
  details: any
  userId: string
  timestamp: string
}

// ================================
// Dashboard Types
// ================================

export interface DashboardState extends BaseState {
  metrics: DashboardMetrics
  recentActivity: ActivityItem[]
  alerts: Alert[]
  complianceTrends: TrendData[]
  reports: ReportSummary[]
  notifications: Notification[]
  quickStats: QuickStats
}

export interface DashboardMetrics {
  totalDocuments: number
  documentsThisMonth: number
  averageComplianceScore: number
  totalViolations: number
  criticalViolations: number
  pendingReviews: number
  recentViolations: number
  processingTime: {
    average: number
    trend: 'up' | 'down' | 'stable'
    change: number
  }
  complianceRate: {
    current: number
    trend: 'up' | 'down' | 'stable'  
    change: number
  }
}

export interface ActivityItem {
  id: string
  type: 'document_uploaded' | 'analysis_completed' | 'violation_detected' | 'user_action'
  title: string
  description?: string
  timestamp: string
  userId?: string
  documentId?: string
  metadata?: any
  read: boolean
}

export interface Alert {
  id: string
  type: 'critical_violation' | 'system_warning' | 'compliance_deadline' | 'update_available'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  actionRequired: boolean
  actionUrl?: string
  createdAt: string
  acknowledgedAt?: string
  expiresAt?: string
}

export interface TrendData {
  date: string
  complianceScore: number
  violations: number
  documentsProcessed: number
  averageProcessingTime: number
}

export interface ReportSummary {
  id: string
  name: string
  type: 'compliance' | 'violation' | 'performance'
  generatedAt: string
  status: 'generating' | 'ready' | 'failed'
  downloadUrl?: string
  parameters?: any
}

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  persistent: boolean
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
}

export interface QuickStats {
  documentsToday: number
  violationsToday: number
  avgScoreToday: number
  processingTimeToday: number
  trendsFromYesterday: {
    documents: number
    violations: number
    avgScore: number
    processingTime: number
  }
}

// ================================
// UI State Types
// ================================

export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebar: {
    isOpen: boolean
    width: number
  }
  modals: Record<string, ModalState>
  notifications: UINotification[]
  loading: LoadingState
  errors: ErrorState[]
  navigation: NavigationState
  preferences: UIPreferences
}

export interface ModalState {
  isOpen: boolean
  data?: any
  loading?: boolean
  error?: string
}

export interface UINotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration: number
  persistent: boolean
  timestamp: string
  actions?: NotificationAction[]
}

export interface NotificationAction {
  text: string
  action: () => void
  variant?: 'primary' | 'secondary'
}

export interface LoadingState {
  global: boolean
  components: Record<string, boolean>
}

export interface ErrorState {
  id: string
  message: string
  component?: string
  timestamp: string
  stack?: string
  recovered?: boolean
}

export interface NavigationState {
  currentPath: string
  previousPath: string
  breadcrumbs: Breadcrumb[]
}

export interface Breadcrumb {
  label: string
  path: string
  active: boolean
}

export interface UIPreferences {
  compactMode: boolean
  animationsEnabled: boolean
  soundEnabled: boolean
  tablePageSize: number
  defaultView: 'grid' | 'list'
  autoRefresh: boolean
  refreshInterval: number
}