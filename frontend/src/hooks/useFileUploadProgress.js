import { useState, useCallback, useRef } from 'react'
import apiService from '../services/apiService'

export const useFileUploadProgress = () => {
  const [uploads, setUploads] = useState(new Map()) // Map of fileId -> upload state
  const [globalProgress, setGlobalProgress] = useState({ current: 0, total: 0 })
  const cancelTokensRef = useRef(new Map())

  // Add file to upload queue
  const addUpload = useCallback((file) => {
    const fileId = `${file.name}-${Date.now()}-${Math.random()}`
    
    const uploadState = {
      fileId,
      file,
      status: 'queued', // queued, uploading, processing, analyzing, completed, failed, cancelled
      progress: 0,
      uploadProgress: 0,
      processingProgress: 0,
      analysisProgress: 0,
      estimatedTimeRemaining: null,
      currentStage: 'queued',
      error: null,
      result: null,
      startTime: null,
      endTime: null
    }

    setUploads(prev => new Map(prev.set(fileId, uploadState)))
    return fileId
  }, [])

  // Update upload progress
  const updateUpload = useCallback((fileId, updates) => {
    setUploads(prev => {
      const current = prev.get(fileId)
      if (!current) return prev
      
      const updated = { ...current, ...updates }
      return new Map(prev.set(fileId, updated))
    })
  }, [])

  // Start file upload with real-time progress
  const startUpload = useCallback(async (fileId, options = {}) => {
    const upload = uploads.get(fileId)
    if (!upload) throw new Error('Upload not found')

    updateUpload(fileId, {
      status: 'uploading',
      startTime: new Date().toISOString(),
      currentStage: 'uploading'
    })

    try {
      // Upload file with progress tracking
      const response = await apiService.uploadDocument(upload.file, {
        requestKey: fileId,
        onProgress: (progressEvent) => {
          const uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          const overallProgress = Math.round(uploadProgress * 0.3) // Upload is 30% of total
          
          updateUpload(fileId, {
            uploadProgress,
            progress: overallProgress,
            estimatedTimeRemaining: calculateEstimatedTime(progressEvent, upload.startTime)
          })
        },
        ...options
      })

      const documentId = response.data.documentId

      updateUpload(fileId, {
        status: 'processing',
        currentStage: 'processing',
        progress: 30,
        documentId
      })

      // Start analysis
      await startAnalysis(fileId, documentId)

    } catch (error) {
      updateUpload(fileId, {
        status: 'failed',
        error: error.message || 'Upload failed',
        endTime: new Date().toISOString()
      })
      throw error
    }
  }, [uploads, updateUpload])

  // Monitor analysis progress using real-time status polling
  const startAnalysis = useCallback(async (fileId, documentId) => {
    updateUpload(fileId, {
      status: 'analyzing',
      currentStage: 'analyzing',
      progress: 30
    })

    try {
      // Poll for analysis status with exponential backoff
      const pollAnalysisStatus = async () => {
        let attempts = 0
        const maxAttempts = 60 // 5 minutes max wait time
        
        while (attempts < maxAttempts) {
          try {
            const statusResponse = await apiService.getAnalysisStatus(documentId)
            const status = statusResponse.data
            
            // Update progress based on real backend status
            updateUpload(fileId, {
              progress: status.progress,
              currentStage: status.status,
              processingProgress: Math.max(0, (status.progress - 30) * (100/70))
            })

            // Check if completed
            if (status.status === 'completed') {
              // Get final results
              const resultsResponse = await apiService.getAnalysisResults(documentId)
              const results = resultsResponse.data.analysisResults[0]

              // Transform backend results to frontend format
              const transformedResult = {
                complianceScore: results.compliance_score,
                overallStatus: results.overall_status,
                violationsFound: results.violations?.length || 0,
                warningsFound: 0, // Calculate based on severity
                suggestionsFound: results.violations?.length || 0,
                violations: results.violations?.map(v => ({
                  type: v.title,
                  severity: v.severity,
                  description: v.description,
                  guideline: v.category,
                  suggestion: v.suggestion
                })) || []
              }

              updateUpload(fileId, {
                status: 'completed',
                progress: 100,
                currentStage: 'completed',
                result: transformedResult,
                endTime: new Date().toISOString()
              })
              return
            }

            // Check if failed
            if (status.status === 'failed') {
              updateUpload(fileId, {
                status: 'failed',
                error: status.message || 'Analysis failed',
                endTime: new Date().toISOString()
              })
              return
            }

            // Wait before next poll (exponential backoff)
            const delay = Math.min(1000 * Math.pow(1.2, attempts), 5000) // Max 5 second delay
            await new Promise(resolve => setTimeout(resolve, delay))
            attempts++

          } catch (statusError) {
            console.warn('Status polling error:', statusError)
            attempts++
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }

        // Timeout - mark as failed
        updateUpload(fileId, {
          status: 'failed',
          error: 'Analysis timeout - please try again',
          endTime: new Date().toISOString()
        })
      }

      // Start polling
      await pollAnalysisStatus()

    } catch (error) {
      updateUpload(fileId, {
        status: 'failed',
        error: error.message || 'Analysis failed',
        endTime: new Date().toISOString()
      })
      throw error
    }
  }, [updateUpload])

  // Cancel upload
  const cancelUpload = useCallback((fileId) => {
    // Cancel API request if in progress
    apiService.cancelRequest(fileId)

    updateUpload(fileId, {
      status: 'cancelled',
      endTime: new Date().toISOString()
    })
  }, [updateUpload])

  // Remove upload from queue
  const removeUpload = useCallback((fileId) => {
    // Cancel if still running
    if (['queued', 'uploading', 'processing', 'analyzing'].includes(uploads.get(fileId)?.status)) {
      cancelUpload(fileId)
    }

    setUploads(prev => {
      const newMap = new Map(prev)
      newMap.delete(fileId)
      return newMap
    })
  }, [uploads, cancelUpload])

  // Batch upload multiple files
  const batchUpload = useCallback(async (files, options = {}) => {
    const fileIds = files.map(file => addUpload(file))
    
    const { maxConcurrent = 3 } = options
    
    // Process uploads in batches to avoid overwhelming the server
    const results = []
    
    for (let i = 0; i < fileIds.length; i += maxConcurrent) {
      const batch = fileIds.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(async (fileId) => {
        try {
          await startUpload(fileId)
          return { fileId, success: true }
        } catch (error) {
          return { fileId, success: false, error }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults)
    }

    return results
  }, [addUpload, startUpload])

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setUploads(prev => {
      const newMap = new Map()
      for (const [fileId, upload] of prev.entries()) {
        if (!['completed', 'failed', 'cancelled'].includes(upload.status)) {
          newMap.set(fileId, upload)
        }
      }
      return newMap
    })
  }, [])

  // Calculate estimated time remaining
  const calculateEstimatedTime = (progressEvent, startTime) => {
    if (!startTime || !progressEvent.loaded || !progressEvent.total) return null

    const elapsed = Date.now() - new Date(startTime).getTime()
    const rate = progressEvent.loaded / elapsed // bytes per ms
    const remaining = progressEvent.total - progressEvent.loaded
    
    return Math.round(remaining / rate / 1000) // seconds
  }

  // Get aggregated stats
  const stats = {
    total: uploads.size,
    queued: Array.from(uploads.values()).filter(u => u.status === 'queued').length,
    uploading: Array.from(uploads.values()).filter(u => u.status === 'uploading').length,
    processing: Array.from(uploads.values()).filter(u => ['processing', 'analyzing'].includes(u.status)).length,
    completed: Array.from(uploads.values()).filter(u => u.status === 'completed').length,
    failed: Array.from(uploads.values()).filter(u => u.status === 'failed').length,
    cancelled: Array.from(uploads.values()).filter(u => u.status === 'cancelled').length
  }

  // Calculate global progress
  const calculateGlobalProgress = () => {
    const uploadList = Array.from(uploads.values())
    if (uploadList.length === 0) return { current: 0, total: 0 }

    const totalProgress = uploadList.reduce((sum, upload) => sum + upload.progress, 0)
    const averageProgress = totalProgress / uploadList.length

    return {
      current: Math.round(averageProgress),
      total: 100,
      activeUploads: uploadList.filter(u => ['uploading', 'processing', 'analyzing'].includes(u.status)).length
    }
  }

  return {
    // State
    uploads: Array.from(uploads.values()),
    uploadsMap: uploads,
    stats,
    globalProgress: calculateGlobalProgress(),

    // Actions
    addUpload,
    startUpload,
    cancelUpload,
    removeUpload,
    batchUpload,
    clearCompleted,

    // Utilities
    getUpload: (fileId) => uploads.get(fileId),
    isUploading: (fileId) => {
      const upload = uploads.get(fileId)
      return upload && ['uploading', 'processing', 'analyzing'].includes(upload.status)
    }
  }
}

export default useFileUploadProgress