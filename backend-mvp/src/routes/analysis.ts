import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.enhanced'
import { userAnalysisRateLimit } from '../middleware/rate-limiter'
import { validateDocumentId, validateAnalysisParams } from '../middleware/validation'
import {
  analyzeDocument,
  getAnalysisResults,
  getAnalysisStatus,
  getAllAnalysisResults
} from '../controllers/analysis'

const router = Router()

// All routes require authentication
router.use(authenticateUser)

// Analysis routes
router.post('/documents/:documentId/analyze', userAnalysisRateLimit, validateDocumentId, validateAnalysisParams, analyzeDocument)
router.get('/documents/:documentId/results', validateDocumentId, getAnalysisResults)
router.get('/documents/:documentId/status', validateDocumentId, getAnalysisStatus)
router.get('/results', getAllAnalysisResults)

export default router