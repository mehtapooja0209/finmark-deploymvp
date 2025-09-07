// Generated types from actual Supabase schema
// This file should match exactly with the database migration schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          name: string
          original_name: string
          type: string
          size: number
          url: string
          status: string
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
          type: string
          size: number
          url: string
          status?: string
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
          type?: string
          size?: number
          url?: string
          status?: string
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
          overall_status: string
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
          overall_status: string
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
          overall_status?: string
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
          severity: string
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
          severity: string
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
          severity?: string
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
          document_type: string
          document_status: string
          file_size: number
          document_created_at: string
          analysis_id: string | null
          compliance_score: number | null
          overall_status: string | null
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
      document_status: "uploaded" | "processing" | "analyzed" | "error"
      compliance_status: "compliant" | "non_compliant" | "needs_review" 
      violation_severity: "low" | "medium" | "high" | "critical"
      document_type: "pdf" | "docx" | "txt" | "html" | "markdown"
    }
  }
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Document = Tables<'documents'>
export type DocumentInsert = TablesInsert<'documents'>
export type DocumentUpdate = TablesUpdate<'documents'>

export type AnalysisResult = Tables<'analysis_results'>
export type AnalysisResultInsert = TablesInsert<'analysis_results'>
export type AnalysisResultUpdate = TablesUpdate<'analysis_results'>

export type Violation = Tables<'violations'>
export type ViolationInsert = TablesInsert<'violations'>
export type ViolationUpdate = TablesUpdate<'violations'>

// Enum types
export type DocumentStatus = Enums<'document_status'>
export type ComplianceStatus = Enums<'compliance_status'>
export type ViolationSeverity = Enums<'violation_severity'>
export type DocumentType = Enums<'document_type'>