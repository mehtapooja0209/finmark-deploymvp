import { Router } from 'express'
import { getRBIGuidelines, getGuidelinesByCategory } from '../controllers/guidelines'

const router = Router()

// Guidelines routes - publicly accessible without authentication
router.get('/rbi', getRBIGuidelines)
router.get('/rbi/:category', getGuidelinesByCategory)

export default router
