import { supabase } from '../config/supabase'
import { DocumentProcessor } from './document-processor'
import { AIService } from './ai-service'
import { logger, logAnalysis } from '../utils/logger'
import { performanceLogger } from '../utils/logger'

interface BatchJob {
  id: string
  userId: string
  documentIds: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  progress: {
    total: number
    completed: number
    failed: number
  }
  results: BatchResult[]
  createdAt: Date
  completedAt?: Date
  error?: string
}

interface BatchResult {
  documentId: string
  status: 'success' | 'failed'
  analysisId?: string
  error?: string
  duration: number
}

interface BatchAnalysisOptions {
  concurrency: number
  retryAttempts: number
  timeoutMs: number
  skipDuplicates: boolean
  notifyOnComplete: boolean
}

export class BatchProcessor {
  private documentProcessor = new DocumentProcessor()
  private aiService = new AIService()
  private activeJobs = new Map<string, BatchJob>()
  private readonly defaultOptions: BatchAnalysisOptions = {
    concurrency: 3, // Process 3 documents simultaneously
    retryAttempts: 2,
    timeoutMs: 300000, // 5 minutes per document
    skipDuplicates: true,
    notifyOnComplete: true,
  }

  async createBatchJob(
    userId: string,
    documentIds: string[],
    options: Partial<BatchAnalysisOptions> = {}
  ): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const mergedOptions = { ...this.defaultOptions, ...options }

    // Validate documents belong to user
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, status, extracted_text')
      .in('id', documentIds)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to validate documents: ${error.message}`)
    }

    if (documents.length !== documentIds.length) {
      throw new Error('Some documents were not found or do not belong to the user')
    }

    // Filter out documents that don't have extracted text
    const validDocuments = documents.filter(doc => doc.extracted_text)
    if (validDocuments.length === 0) {
      throw new Error('No documents have extracted text for analysis')
    }

    // Skip documents that already have analysis results if requested
    let finalDocumentIds = validDocuments.map(d => d.id)
    if (mergedOptions.skipDuplicates) {
      const { data: existingAnalyses } = await supabase
        .from('analysis_results')
        .select('document_id')
        .in('document_id', finalDocumentIds)
        .eq('user_id', userId)

      if (existingAnalyses && existingAnalyses.length > 0) {
        const analyzedIds = existingAnalyses.map(a => a.document_id)
        finalDocumentIds = finalDocumentIds.filter(id => !analyzedIds.includes(id))
        
        logger.info('Skipping already analyzed documents', {
          skipped: analyzedIds.length,
          remaining: finalDocumentIds.length
        })
      }
    }

    if (finalDocumentIds.length === 0) {
      throw new Error('All documents have already been analyzed')
    }

    const batchJob: BatchJob = {
      id: jobId,
      userId,
      documentIds: finalDocumentIds,
      status: 'pending',
      progress: {
        total: finalDocumentIds.length,
        completed: 0,
        failed: 0,
      },
      results: [],
      createdAt: new Date(),
    }

    this.activeJobs.set(jobId, batchJob)

    logger.info('Batch job created', {
      jobId,
      userId,
      totalDocuments: finalDocumentIds.length,
      options: mergedOptions,
    })

    // Start processing asynchronously
    this.processBatchJob(jobId, mergedOptions).catch(error => {
      logger.error('Batch job failed', { jobId, error })
      this.updateJobStatus(jobId, 'failed', error.message)
    })

    return jobId
  }

  private async processBatchJob(jobId: string, options: BatchAnalysisOptions): Promise<void> {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    job.status = 'processing'
    const startTime = Date.now()

    logger.info('Starting batch job processing', {
      jobId,
      documentCount: job.documentIds.length,
      concurrency: options.concurrency,
    })

    try {
      // Process documents in batches with controlled concurrency
      const results = await this.processWithConcurrency(
        job.documentIds,
        (documentId) => this.processDocument(documentId, job.userId, options),
        options.concurrency
      )

      // Update job with results
      job.results = results
      job.progress.completed = results.filter(r => r.status === 'success').length
      job.progress.failed = results.filter(r => r.status === 'failed').length
      job.completedAt = new Date()

      // Determine final status
      if (job.progress.failed === 0) {
        job.status = 'completed'
      } else if (job.progress.completed === 0) {
        job.status = 'failed'
      } else {
        job.status = 'partial'
      }

      const duration = Date.now() - startTime
      logger.info('Batch job completed', {
        jobId,
        status: job.status,
        completed: job.progress.completed,
        failed: job.progress.failed,
        duration,
      })

      // Optional: Send notification or webhook
      if (options.notifyOnComplete) {
        await this.notifyJobComplete(job)
      }

    } catch (error: any) {
      job.status = 'failed'
      job.error = error.message
      job.completedAt = new Date()
      
      logger.error('Batch job processing failed', {
        jobId,
        error: error.message,
        duration: Date.now() - startTime,
      })
    }
  }

  private async processDocument(
    documentId: string,
    userId: string,
    options: BatchAnalysisOptions
  ): Promise<BatchResult> {
    const startTime = Date.now()
    let attempts = 0

    while (attempts <= options.retryAttempts) {
      try {
        logAnalysis.start(documentId, userId, 0) // Length unknown in batch

        // Get document with extracted text
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('extracted_text')
          .eq('id', documentId)
          .eq('user_id', userId)
          .single()

        if (docError || !document?.extracted_text) {
          throw new Error('Document not found or has no extracted text')
        }

        // Process with timeout
        const analysisPromise = this.aiService.analyzeCompliance(
          document.extracted_text,
          documentId,
          userId
        )

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Analysis timeout')), options.timeoutMs)
        })

        await Promise.race([analysisPromise, timeoutPromise])

        const duration = Date.now() - startTime
        logAnalysis.complete(documentId, userId, duration, 0) // Score unknown

        return {
          documentId,
          status: 'success',
          duration,
        }

      } catch (error: any) {
        attempts++
        const duration = Date.now() - startTime

        if (attempts <= options.retryAttempts) {
          logger.warn('Document processing failed, retrying', {
            documentId,
            attempt: attempts,
            error: error.message,
          })
          
          // Exponential backoff
          await this.delay(Math.pow(2, attempts) * 1000)
        } else {
          logAnalysis.error(documentId, userId, error, duration)
          
          return {
            documentId,
            status: 'failed',
            error: error.message,
            duration,
          }
        }
      }
    }

    // This should never be reached
    return {
      documentId,
      status: 'failed',
      error: 'Max retries exceeded',
      duration: Date.now() - startTime,
    }
  }

  private async processWithConcurrency<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number
  ): Promise<R[]> {
    const results: R[] = []
    const executing: Promise<void>[] = []

    for (const item of items) {
      const promise = processor(item).then(result => {
        results.push(result)
      })

      executing.push(promise)

      if (executing.length >= concurrency) {
        await Promise.race(executing)
        // Remove completed promises
        for (let i = executing.length - 1; i >= 0; i--) {
          if (await this.isPromiseResolved(executing[i])) {
            executing.splice(i, 1)
          }
        }
      }
    }

    // Wait for remaining promises
    await Promise.all(executing)
    return results
  }

  private async isPromiseResolved(promise: Promise<any>): Promise<boolean> {
    try {
      await Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, 0))
      ])
      return true
    } catch {
      return true // Promise rejected, which means it's resolved
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private updateJobStatus(jobId: string, status: BatchJob['status'], error?: string): void {
    const job = this.activeJobs.get(jobId)
    if (job) {
      job.status = status
      if (error) job.error = error
      job.completedAt = new Date()
    }
  }

  private async notifyJobComplete(job: BatchJob): Promise<void> {
    // This could send an email, webhook, or in-app notification
    logger.info('Batch job notification sent', {
      jobId: job.id,
      userId: job.userId,
      status: job.status,
    })
  }

  // Public API methods
  async getBatchJobStatus(jobId: string, userId: string): Promise<BatchJob | null> {
    const job = this.activeJobs.get(jobId)
    if (!job || job.userId !== userId) {
      return null
    }
    return { ...job } // Return a copy
  }

  async cancelBatchJob(jobId: string, userId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job || job.userId !== userId) {
      return false
    }

    if (job.status === 'processing') {
      job.status = 'failed'
      job.error = 'Cancelled by user'
      job.completedAt = new Date()
      
      logger.info('Batch job cancelled', { jobId, userId })
      return true
    }

    return false
  }

  async getUserBatchJobs(userId: string): Promise<BatchJob[]> {
    const userJobs: BatchJob[] = []
    
    for (const job of this.activeJobs.values()) {
      if (job.userId === userId) {
        userJobs.push({ ...job })
      }
    }
    
    return userJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Cleanup completed jobs older than 24 hours
  cleanupOldJobs(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000)
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.completedAt && job.completedAt.getTime() < cutoff) {
        this.activeJobs.delete(jobId)
        logger.debug('Cleaned up old batch job', { jobId })
      }
    }
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor()

// Cleanup job - run every hour
setInterval(() => {
  batchProcessor.cleanupOldJobs()
}, 60 * 60 * 1000)