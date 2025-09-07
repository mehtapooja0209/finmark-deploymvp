import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.enhanced'
import { userAnalysisRateLimit } from '../middleware/rate-limiter'
import { validateDocumentId, validateAnalysisParams } from '../middleware/validation'
import {
  analyzeMarketingContent,
  quickMarketingCheck,
  getMarketingRecommendations,
  getComplianceStatistics,
  validateMarketingSetup
} from '../controllers/marketing'

const router = Router()

// All routes require authentication
router.use(authenticateUser)

// Marketing compliance routes
router.post('/analyze/content', userAnalysisRateLimit, analyzeMarketingContent)
router.post('/check/quick', quickMarketingCheck)
router.post('/documents/:documentId/analyze', userAnalysisRateLimit, validateDocumentId, validateAnalysisParams, analyzeMarketingContent)
router.get('/documents/:documentId/recommendations', validateDocumentId, getMarketingRecommendations)
router.get('/statistics', getComplianceStatistics)
router.get('/setup/validate', validateMarketingSetup)

export default router