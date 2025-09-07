import { z } from 'zod'

// User and Authentication Types
export enum UserRole {
  ADMIN = 'ADMIN',
  COMPLIANCE_MANAGER = 'COMPLIANCE_MANAGER',
  ANALYST = 'ANALYST',
  REVIEWER = 'REVIEWER'
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.nativeEnum(UserRole),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true)
})

export type User = z.infer<typeof UserSchema>

// Organization Types
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  domain: z.string().optional(),
  settings: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Organization = z.infer<typeof OrganizationSchema>

// Document Types
export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  ANALYZED = 'ANALYZED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum DocumentType {
  PDF = 'PDF',
  DOC = 'DOC',
  DOCX = 'DOCX',
  TXT = 'TXT',
  IMAGE = 'IMAGE'
}

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.nativeEnum(DocumentType),
  size: z.number(),
  url: z.string().url(),
  status: z.nativeEnum(DocumentStatus),
  projectId: z.string().uuid(),
  uploadedBy: z.string().uuid(),
  extractedText: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Document = z.infer<typeof DocumentSchema>

// Project Types
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
  organizationId: z.string().uuid(),
  createdBy: z.string().uuid(),
  members: z.array(z.string().uuid()),
  settings: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Project = z.infer<typeof ProjectSchema>

// Compliance Analysis Types
export enum ViolationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ViolationStatus {
  DETECTED = 'DETECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE'
}

export const ViolationSchema = z.object({
  id: z.string().uuid(),
  ruleId: z.string(),
  category: z.string(),
  description: z.string(),
  severity: z.nativeEnum(ViolationSeverity),
  status: z.nativeEnum(ViolationStatus),
  location: z.object({
    page: z.number().optional(),
    line: z.number().optional(),
    startChar: z.number().optional(),
    endChar: z.number().optional(),
    text: z.string()
  }),
  suggestion: z.string().optional(),
  regulatoryReference: z.string().optional(),
  confidence: z.number().min(0).max(1),
  resolvedBy: z.string().uuid().optional(),
  resolvedAt: z.date().optional(),
  notes: z.string().optional()
})

export type Violation = z.infer<typeof ViolationSchema>

export const AnalysisResultSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  complianceScore: z.number().min(0).max(100),
  overallStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'NEEDS_REVIEW']),
  violations: z.array(ViolationSchema),
  recommendations: z.array(z.string()),
  aiModelUsed: z.string(),
  processingTime: z.number(),
  analyzedBy: z.string().uuid(),
  reviewedBy: z.string().uuid().optional(),
  reviewedAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

// RBI Guidelines Types
export const RBIGuidelineSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  effectiveDate: z.date(),
  version: z.string(),
  keywords: z.array(z.string()),
  requirements: z.array(z.string()),
  penalties: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  lastUpdated: z.date()
})

export type RBIGuideline = z.infer<typeof RBIGuidelineSchema>

// AI Analysis Types
export const AIAnalysisRequestSchema = z.object({
  documentId: z.string().uuid(),
  content: z.string(),
  documentType: z.nativeEnum(DocumentType),
  analysisType: z.enum(['FULL', 'QUICK', 'TARGETED']),
  guidelines: z.array(z.string()).optional(),
  userId: z.string().uuid()
})

export type AIAnalysisRequest = z.infer<typeof AIAnalysisRequestSchema>

export const AIAnalysisResponseSchema = z.object({
  documentId: z.string().uuid(),
  complianceScore: z.number().min(0).max(100),
  violations: z.array(ViolationSchema),
  recommendations: z.array(z.string()),
  summary: z.string(),
  modelUsed: z.string(),
  confidence: z.number().min(0).max(1),
  processingTime: z.number()
})

export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>

// Dashboard Analytics Types
export const DashboardStatsSchema = z.object({
  totalDocuments: z.number(),
  documentsProcessed: z.number(),
  averageComplianceScore: z.number(),
  totalViolations: z.number(),
  violationsByCategory: z.record(z.number()),
  violationsBySeverity: z.record(z.number()),
  processingTime: z.object({
    average: z.number(),
    median: z.number(),
    p95: z.number()
  }),
  trendsOverTime: z.array(z.object({
    date: z.date(),
    complianceScore: z.number(),
    violationsCount: z.number()
  }))
})

export type DashboardStats = z.infer<typeof DashboardStatsSchema>

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.date(),
  requestId: z.string().optional()
})

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
  requestId?: string
}

// WebSocket Event Types
export enum SocketEvent {
  DOCUMENT_UPLOADED = 'document:uploaded',
  ANALYSIS_STARTED = 'analysis:started',
  ANALYSIS_PROGRESS = 'analysis:progress',
  ANALYSIS_COMPLETED = 'analysis:completed',
  VIOLATION_DETECTED = 'violation:detected',
  TEAM_NOTIFICATION = 'team:notification',
  PROJECT_UPDATE = 'project:update'
}

export const SocketEventDataSchema = z.object({
  event: z.nativeEnum(SocketEvent),
  data: z.any(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  timestamp: z.date()
})

export type SocketEventData = z.infer<typeof SocketEventDataSchema>

// File Upload Types
export const FileUploadSchema = z.object({
  file: z.any(), // File object
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  metadata: z.record(z.any()).optional()
})

export type FileUpload = z.infer<typeof FileUploadSchema>

// Report Types
export enum ReportType {
  COMPLIANCE_SUMMARY = 'COMPLIANCE_SUMMARY',
  VIOLATION_DETAILS = 'VIOLATION_DETAILS',
  TREND_ANALYSIS = 'TREND_ANALYSIS',
  AUDIT_REPORT = 'AUDIT_REPORT'
}

export const ReportConfigSchema = z.object({
  type: z.nativeEnum(ReportType),
  projectId: z.string().uuid().optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  filters: z.record(z.any()).optional(),
  format: z.enum(['PDF', 'EXCEL', 'JSON']),
  includeCharts: z.boolean().default(true),
  includeDetails: z.boolean().default(true)
})

export type ReportConfig = z.infer<typeof ReportConfigSchema>