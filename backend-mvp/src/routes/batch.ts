import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.enhanced'
import { analysisRateLimit } from '../middleware/rate-limiter'
import {
  createBatchAnalysis,
  getBatchJobStatus,
  cancelBatchJob,
  getUserBatchJobs,
  getBatchJobResults
} from '../controllers/batch'

const router = Router()

// All routes require authentication
router.use(authenticateUser)

// Batch analysis routes
router.post('/analyze', analysisRateLimit, createBatchAnalysis)
router.get('/jobs', getUserBatchJobs)
router.get('/jobs/:jobId', getBatchJobStatus)
router.get('/jobs/:jobId/results', getBatchJobResults)
router.post('/jobs/:jobId/cancel', cancelBatchJob)

export default router