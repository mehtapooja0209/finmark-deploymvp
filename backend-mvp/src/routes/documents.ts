import { Router } from 'express'
import multer from 'multer'
import { authenticateUser } from '../middleware/auth.enhanced'
import { uploadRateLimit } from '../middleware/rate-limiter'
import { validateFileUpload, validateDocumentId } from '../middleware/validation'
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument
} from '../controllers/documents'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF files and images for OCR processing
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files and images (JPG, PNG, GIF, WebP) are allowed'))
    }
  }
})

// All routes require authentication (now bypassed in middleware for testing)
router.use(authenticateUser)

// Document routes
router.post('/upload', upload.single('document'), validateFileUpload, uploadDocument) // uploadRateLimit removed
router.get('/', getDocuments)
router.get('/:id', validateDocumentId, getDocument)
router.delete('/:id', validateDocumentId, deleteDocument)

export default router