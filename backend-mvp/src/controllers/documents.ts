import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { DocumentProcessor } from '../services/document-processor'
import { AIService } from '../services/ai-service'
import { supabase } from '../config/supabase'

const documentProcessor = new DocumentProcessor()
const aiService = new AIService()

export const uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Authentication check temporarily disabled
    // if (!req.user) {
    //   return res.status(401).json({ error: 'User not authenticated' })
    // }
    
    // Set mock user if not present
    if (!req.user) {
      req.user = {
        id: 'mock-user-id',
        email: 'mock-user@example.com'
      }
    }

    // Process document (OCR, text extraction)
    const document = await documentProcessor.processDocument(req.file, req.user.id)
    
    // Get scan configuration from request body (if provided)
    const scanConfig = req.body.scanConfig ? JSON.parse(req.body.scanConfig) : {}
    
    // Start automatic analysis if document has extracted text
    if (document.extracted_text) {
      // Trigger analysis in background - don't wait for completion
      setImmediate(async () => {
        try {
          await aiService.analyzeCompliance(
            document.extracted_text,
            document.id,
            req.user!.id
          )
        } catch (error) {
          console.error('Auto-analysis failed:', error)
        }
      })
    }
    
    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        ...document,
        autoAnalysisStarted: !!document.extracted_text
      }
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      error: 'Failed to upload document',
      details: error.message 
    })
  }
}

export const getDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authentication check temporarily disabled
    // if (!req.user) {
    //   return res.status(401).json({ error: 'User not authenticated' })
    // }
    
    // Set mock user if not present
    if (!req.user) {
      req.user = {
        id: 'mock-user-id',
        email: 'mock-user@example.com'
      }
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    res.json({ documents })
  } catch (error: any) {
    console.error('Get documents error:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      details: error.message 
    })
  }
}

export const getDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authentication check temporarily disabled
    // if (!req.user) {
    //   return res.status(401).json({ error: 'User not authenticated' })
    // }
    
    // Set mock user if not present
    if (!req.user) {
      req.user = {
        id: 'mock-user-id',
        email: 'mock-user@example.com'
      }
    }

    const { id } = req.params

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Document not found' })
      }
      throw new Error(`Database error: ${error.message}`)
    }

    res.json({ document })
  } catch (error: any) {
    console.error('Get document error:', error)
    res.status(500).json({ 
      error: 'Failed to retrieve document',
      details: error.message 
    })
  }
}

export const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Authentication check temporarily disabled
    // if (!req.user) {
    //   return res.status(401).json({ error: 'User not authenticated' })
    // }
    
    // Set mock user if not present
    if (!req.user) {
      req.user = {
        id: 'mock-user-id',
        email: 'mock-user@example.com'
      }
    }

    const { id } = req.params

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    res.json({ message: 'Document deleted successfully' })
  } catch (error: any) {
    console.error('Delete document error:', error)
    res.status(500).json({ 
      error: 'Failed to delete document',
      details: error.message 
    })
  }
}
