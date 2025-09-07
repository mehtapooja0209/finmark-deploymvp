import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { AIService } from '../services/ai-service'
import { supabase } from '../config/supabase'
import { Document } from '../types/database.generated'

interface AnalysisStatusResponse {
  documentId: string;
  status: string;
  progress: number;
  message: string;
  hasExtractedText: boolean;
  hasAnalysisResults: boolean;
  lastUpdated: any;
  summary?: {
    complianceScore: number;
    overallStatus: string;
    analyzedAt: any;
  };
}

const aiService = new AIService()

export const analyzeDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { documentId } = req.params

    // Get document with extracted text
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', req.user.id)
      .single()

    if (docError) {
      if (docError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Document not found' })
      }
      throw new Error(`Database error: ${docError.message}`)
    }

    if (!document || !document.extracted_text) {
      return res.status(400).json({ 
        error: 'Document has no extracted text to analyze' 
      })
    }

    // Update document status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    // Perform AI analysis
    const analysis = await aiService.analyzeCompliance(
      document.extracted_text,
      documentId,
      req.user.id
    )

    res.json({
      message: 'Document analyzed successfully',
      analysis
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    
    // Update document status to error
    if (req.params.documentId) {
      await supabase
        .from('documents')
        .update({ status: 'error' })
        .eq('id', req.params.documentId)
    }

    res.status(500).json({ 
      error: 'Failed to analyze document',
      details: error.message 
    })
  }
}

export const getAnalysisResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { documentId } = req.params

    const { data: analysisResults, error } = await supabase
      .from('analysis_results')
      .select(`
        *,
        violations (*)
      `)
      .eq('document_id', documentId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    res.json({ analysisResults })
  } catch (error: any) {
    console.error('Get analysis results error:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve analysis results',
      details: error.message 
    })
  }
}

export const getAnalysisStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { documentId } = req.params

    // Get document status and check for analysis results
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('status, extracted_text, created_at')
      .eq('id', documentId)
      .eq('user_id', req.user.id)
      .single()

    if (docError) {
      if (docError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Document not found' })
      }
      throw new Error(`Database error: ${docError.message}`)
    }

    // Check if analysis results exist
    const { data: analysisResults, error: analysisError } = await supabase
      .from('analysis_results')
      .select('compliance_score, overall_status, created_at')
      .eq('document_id', documentId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (analysisError) {
      throw new Error(`Database error: ${analysisError.message}`)
    }

    // Determine current status
    let currentStatus = 'pending'
    let progress = 0
    let message = 'Waiting to start analysis'
    
    if (document.status === 'processing') {
      currentStatus = 'processing'
      progress = 30
      message = 'Processing document and extracting text'
    } else if (document.status === 'analyzed' && analysisResults.length > 0) {
      currentStatus = 'completed'
      progress = 100
      message = 'Analysis completed successfully'
    } else if (document.status === 'error') {
      currentStatus = 'failed'
      progress = 0
      message = 'Analysis failed'
    } else if (document.extracted_text) {
      // Document is ready for analysis but no results yet
      currentStatus = 'analyzing'
      progress = 60
      message = 'Analyzing compliance against RBI guidelines'
    }

    const response: AnalysisStatusResponse = {
      documentId,
      status: currentStatus,
      progress,
      message,
      hasExtractedText: !!document.extracted_text,
      hasAnalysisResults: analysisResults.length > 0,
      lastUpdated: document.created_at
    }

    // Add analysis summary if completed
    if (currentStatus === 'completed' && analysisResults.length > 0) {
      response.summary = {
        complianceScore: analysisResults[0].compliance_score,
        overallStatus: analysisResults[0].overall_status,
        analyzedAt: analysisResults[0].created_at
      }
    }

    res.json(response)
  } catch (error: any) {
    console.error('Get analysis status error:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve analysis status',
      details: error.message 
    })
  }
}

export const getAllAnalysisResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data: analysisResults, error } = await supabase
      .from('analysis_results')
      .select(`
        *,
        documents (name, original_name),
        violations (*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    res.json({ analysisResults })
  } catch (error: any) {
    console.error('Get all analysis results error:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve analysis results',
      details: error.message 
    })
  }
}