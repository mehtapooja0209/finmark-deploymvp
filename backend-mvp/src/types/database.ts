// Auto-generated TypeScript types for Supabase schema
// This file defines the complete database schema types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DocumentStatus = 'uploaded' | 'processing' | 'analyzed' | 'error'
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'needs_review'
export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical'
export type DocumentType = 'pdf' | 'docx' | 'txt' | 'html' | 'markdown'

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          name: string
          original_name: string
          type: DocumentType
          size: number
          url: string
          status: DocumentStatus
          extracted_text: string | null
          user_id: string
          created_at: string
          updated_at: string
          file_hash: string | null
          processing_started_at: string | null
          processing_completed_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          name: string
          original_name: string
          type: DocumentType
          size: number
          url: string
          status?: DocumentStatus
          extracted_text?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          file_hash?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          name?: string
          original_name?: string
          type?: DocumentType
          size?: number
          url?: string
          status?: DocumentStatus
          extracted_text?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          file_hash?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
        }
      }
      analysis_results: {
        Row: {
          id: string
          document_id: string
          compliance_score: number
          overall_status: ComplianceStatus
          ai_model_used: string
          confidence: number
          user_id: string
          created_at: string
          updated_at: string
          processing_time_ms: number | null
          tokens_used: number | null
          cost_usd: number | null
          analysis_version: string | null
          analysis_metadata: Json
          ai_raw_response: Json | null
        }
        Insert: {
          id?: string
          document_id: string
          compliance_score: number
          overall_status: ComplianceStatus
          ai_model_used: string
          confidence: number
          user_id: string
          created_at?: string
          updated_at?: string
          processing_time_ms?: number | null
          tokens_used?: number | null
          cost_usd?: number | null
          analysis_version?: string | null
          analysis_metadata?: Json
          ai_raw_response?: Json | null
        }
        Update: {
          id?: string
          document_id?: string
          compliance_score?: number
          overall_status?: ComplianceStatus
          ai_model_used?: string
          confidence?: number
          user_id?: string
          created_at?: string
          updated_at?: string
          processing_time_ms?: number | null
          tokens_used?: number | null
          cost_usd?: number | null
          analysis_version?: string | null
          analysis_metadata?: Json
          ai_raw_response?: Json | null
        }
      }
      violations: {
        Row: {
          id: string
          analysis_result_id: string
          category: string
          title: string
          description: string
          severity: ViolationSeverity
          confidence: number
          suggestion: string | null
          created_at: string
          rule_id: string | null
          matched_text: string | null
          context_before: string | null
          context_after: string | null
          line_number: number | null
          character_position: number | null
          violation_metadata: Json
          remediation_options: Json
        }
        Insert: {
          id?: string
          analysis_result_id: string
          category: string
          title: string
          description: string
          severity: ViolationSeverity
          confidence: number
          suggestion?: string | null
          created_at?: string
          rule_id?: string | null
          matched_text?: string | null
          context_before?: string | null
          context_after?: string | null
          line_number?: number | null
          character_position?: number | null
          violation_metadata?: Json
          remediation_options?: Json
        }
        Update: {
          id?: string
          analysis_result_id?: string
          category?: string
          title?: string
          description?: string
          severity?: ViolationSeverity
          confidence?: number
          suggestion?: string | null
          created_at?: string
          rule_id?: string | null
          matched_text?: string | null
          context_before?: string | null
          context_after?: string | null
          line_number?: number | null
          character_position?: number | null
          violation_metadata?: Json
          remediation_options?: Json
        }
      }
    }
    Views: {
      complete_analysis_view: {
        Row: {
          document_id: string
          document_name: string
          original_name: string
          document_type: DocumentType
          document_status: DocumentStatus
          file_size: number
          document_created_at: string
          analysis_id: string | null
          compliance_score: number | null
          overall_status: ComplianceStatus | null
          ai_model_used: string | null
          confidence: number | null
          analysis_created_at: string | null
          violation_count: number
          violations: Json
        }
      }
    }
    Functions: {
      get_user_compliance_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      document_status: DocumentStatus
      compliance_status: ComplianceStatus
      violation_severity: ViolationSeverity
      document_type: DocumentType
    }
  }
}

// Helper types for common operations
export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export type AnalysisResultRow = Database['public']['Tables']['analysis_results']['Row']
export type AnalysisResultInsert = Database['public']['Tables']['analysis_results']['Insert']
export type AnalysisResultUpdate = Database['public']['Tables']['analysis_results']['Update']

export type ViolationRow = Database['public']['Tables']['violations']['Row']
export type ViolationInsert = Database['public']['Tables']['violations']['Insert']
export type ViolationUpdate = Database['public']['Tables']['violations']['Update']

export type CompleteAnalysisView = Database['public']['Views']['complete_analysis_view']['Row']

// Application-specific types that extend database types
export interface DocumentWithAnalysis extends DocumentRow {
  analysis_results?: AnalysisResultRow[]
  latest_analysis?: AnalysisResultRow
}

export interface AnalysisResultWithViolations extends AnalysisResultRow {
  violations: ViolationRow[]
  document?: DocumentRow
}

export interface ComplianceStatistics {
  totalDocuments: number
  totalAnalyses: number
  averageScore: number
  complianceDistribution: {
    compliant: number
    needs_review: number
    non_compliant: number
  }
  totalViolations: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Validation schemas (for runtime type checking)
export const DocumentStatusValues: DocumentStatus[] = ['uploaded', 'processing', 'analyzed', 'error']
export const ComplianceStatusValues: ComplianceStatus[] = ['compliant', 'non_compliant', 'needs_review']  
export const ViolationSeverityValues: ViolationSeverity[] = ['low', 'medium', 'high', 'critical']
export const DocumentTypeValues: DocumentType[] = ['pdf', 'docx', 'txt', 'html', 'markdown']

// Type guards
export function isDocumentStatus(value: string): value is DocumentStatus {
  return DocumentStatusValues.includes(value as DocumentStatus)
}

export function isComplianceStatus(value: string): value is ComplianceStatus {
  return ComplianceStatusValues.includes(value as ComplianceStatus)
}

export function isViolationSeverity(value: string): value is ViolationSeverity {
  return ViolationSeverityValues.includes(value as ViolationSeverity)
}

export function isDocumentType(value: string): value is DocumentType {
  return DocumentTypeValues.includes(value as DocumentType)
}