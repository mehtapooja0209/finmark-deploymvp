import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'
import { batchProcessor } from '../services/batch-processor'
import { logger } from '../utils/logger'
import { supabase } from '../config/supabase'
import { z } from 'zod'

// Validation schemas
const createBatchJobSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document ID is required').max(50, 'Maximum 50 documents per batch'),
  options: z.object({
    concurrency: z.number().min(1).max(10).optional(),
    retryAttempts: z.number().min(0).max(5).optional(),
    timeoutMs: z.number().min(30000).max(600000).optional(), // 30s to 10min
    skipDuplicates: z.boolean().optional(),
    notifyOnComplete: z.boolean().optional(),
  }).optional()
})

export const createBatchAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Validate request body
    const result = createBatchJobSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }

    const { documentIds, options } = result.data

    logger.info('Creating batch analysis job', {
      userId: req.user.id,
      documentCount: documentIds.length,
      options
    })

    const jobId = await batchProcessor.createBatchJob(
      req.user.id,
      documentIds,
      options
    )

    res.status(201).json({
      message: 'Batch analysis job created',
      jobId,
      documentCount: documentIds.length
    })

  } catch (error: any) {
    logger.error('Create batch analysis error', {
      userId: req.user?.id,
      error: error.message
    })
    
    res.status(500).json({
      error: 'Failed to create batch analysis job',
      details: error.message
    })
  }
}

export const getBatchJobStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { jobId } = req.params

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' })
    }

    const job = await batchProcessor.getBatchJobStatus(jobId, req.user.id)

    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' })
    }

    res.json({ job })

  } catch (error: any) {
    logger.error('Get batch job status error', {
      userId: req.user?.id,
      jobId: req.params.jobId,
      error: error.message
    })
    
    res.status(500).json({
      error: 'Failed to get batch job status',
      details: error.message
    })
  }
}

export const cancelBatchJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { jobId } = req.params

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' })
    }

    const cancelled = await batchProcessor.cancelBatchJob(jobId, req.user.id)

    if (!cancelled) {
      return res.status(400).json({ 
        error: 'Cannot cancel job',
        message: 'Job not found, already completed, or not cancellable'
      })
    }

    logger.info('Batch job cancelled', {
      userId: req.user.id,
      jobId
    })

    res.json({ message: 'Batch job cancelled successfully' })

  } catch (error: any) {
    logger.error('Cancel batch job error', {
      userId: req.user?.id,
      jobId: req.params.jobId,
      error: error.message
    })
    
    res.status(500).json({
      error: 'Failed to cancel batch job',
      details: error.message
    })
  }
}

export const getUserBatchJobs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const jobs = await batchProcessor.getUserBatchJobs(req.user.id)

    // Add summary statistics
    const summary = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      partial: jobs.filter(j => j.status === 'partial').length,
    }

    res.json({ 
      jobs,
      summary
    })

  } catch (error: any) {
    logger.error('Get user batch jobs error', {
      userId: req.user?.id,
      error: error.message
    })
    
    res.status(500).json({
      error: 'Failed to get batch jobs',
      details: error.message
    })
  }
}

export const getBatchJobResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { jobId } = req.params

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' })
    }

    const job = await batchProcessor.getBatchJobStatus(jobId, req.user.id)

    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' })
    }

    // Get detailed analysis results for successful documents
    const successfulDocumentIds = job.results
      .filter(r => r.status === 'success')
      .map(r => r.documentId)

    let analysisResults: any[] = []
    if (successfulDocumentIds.length > 0) {
      const { data, error } = await supabase
        .from('analysis_results')
        .select(`
          *,
          documents (name, original_name),
          violations (*)
        `)
        .in('document_id', successfulDocumentIds)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch analysis results', { error })
      } else {
        analysisResults = data || []
      }
    }

    res.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error
      },
      results: {
        summary: job.results,
        analysisResults
      }
    })

  } catch (error: any) {
    logger.error('Get batch job results error', {
      userId: req.user?.id,
      jobId: req.params.jobId,
      error: error.message
    })
    
    res.status(500).json({
      error: 'Failed to get batch job results',
      details: error.message
    })
  }
}