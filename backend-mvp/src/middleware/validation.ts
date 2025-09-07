import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// Document text validation schema
const documentTextSchema = z.object({
  text: z.string()
    .min(50, 'Document text must be at least 50 characters long')
    .max(1000000, 'Document text is too large (max 1MB)')
    .refine(text => {
      // Check for meaningful content (not just whitespace/special characters)
      const meaningfulContent = text.replace(/[\s\n\r\t]/g, '').length
      return meaningfulContent > 20
    }, 'Document must contain meaningful text content')
    .refine(text => {
      // Basic check for suspicious content
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /data:text\/html/i
      ]
      return !suspiciousPatterns.some(pattern => pattern.test(text))
    }, 'Document contains potentially malicious content')
})

// File validation schema
const fileUploadSchema = z.object({
  originalname: z.string().min(1, 'File name is required'),
  mimetype: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ], {
    message: 'Only PDF files and images (JPG, PNG, GIF, WebP) are allowed'
  }),
  size: z.number()
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  buffer: z.instanceof(Buffer, { message: 'Invalid file buffer' })
})

// Document ID validation
const documentIdSchema = z.string().uuid('Invalid document ID format')

// Analysis parameters validation
const analysisParamsSchema = z.object({
  documentId: documentIdSchema,
  options: z.object({
    includeViolations: z.boolean().optional().default(true),
    confidenceThreshold: z.number().min(0).max(1).optional().default(0.5),
    maxViolations: z.number().min(1).max(100).optional().default(50)
  }).optional()
})

export const validateDocumentText = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = documentTextSchema.safeParse({ text: req.body.text })
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid document text',
        details: result.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }
    
    next()
  } catch (error) {
    console.error('Text validation error:', error)
    res.status(500).json({ error: 'Validation error' })
  }
}

export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      })
    }

    const result = fileUploadSchema.safeParse(req.file)
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid file',
        details: result.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }
    
    // Additional file name validation
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    if (sanitizedName !== req.file.originalname) {
      req.file.originalname = sanitizedName
    }
    
    next()
  } catch (error) {
    console.error('File validation error:', error)
    res.status(500).json({ error: 'Validation error' })
  }
}

export const validateDocumentId = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = documentIdSchema.safeParse(req.params.documentId || req.params.id)
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid document ID',
        message: 'Document ID must be a valid UUID'
      })
    }
    
    next()
  } catch (error) {
    console.error('Document ID validation error:', error)
    res.status(500).json({ error: 'Validation error' })
  }
}

export const validateAnalysisParams = (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      documentId: req.params.documentId,
      options: req.body.options
    }
    
    const result = analysisParamsSchema.safeParse(params)
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid analysis parameters',
        details: result.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }
    
    // Add validated options to request
    req.body.validatedOptions = result.data.options || {}
    
    next()
  } catch (error) {
    console.error('Analysis params validation error:', error)
    res.status(500).json({ error: 'Validation error' })
  }
}

// Comprehensive text content analysis
export const analyzeTextContent = (text: string): {
  isValid: boolean
  metrics: {
    length: number
    wordCount: number
    sentenceCount: number
    paragraphCount: number
    readabilityScore: number
  }
  warnings: string[]
} => {
  const warnings: string[] = []
  
  // Basic metrics
  const length = text.length
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  
  // Simple readability score (characters per word)
  const readabilityScore = wordCount > 0 ? length / wordCount : 0
  
  // Content quality checks
  if (wordCount < 100) {
    warnings.push('Document appears to be very short for compliance analysis')
  }
  
  if (sentenceCount < 5) {
    warnings.push('Document has very few sentences')
  }
  
  if (readabilityScore > 15) {
    warnings.push('Text may contain excessive technical jargon or formatting artifacts')
  }
  
  // Check for potential OCR errors or garbled text
  const specialCharRatio = (text.match(/[^\w\s.,!?;:()-]/g) || []).length / length
  if (specialCharRatio > 0.1) {
    warnings.push('High ratio of special characters detected - may indicate OCR errors')
  }
  
  // Check for repeated patterns (common in extraction errors)
  const repeatedPatterns = text.match(/(.{10,})\1{3,}/g)
  if (repeatedPatterns && repeatedPatterns.length > 0) {
    warnings.push('Repeated text patterns detected - may indicate extraction errors')
  }
  
  return {
    isValid: warnings.length < 3, // Allow some warnings but not too many
    metrics: {
      length,
      wordCount,
      sentenceCount,
      paragraphCount,
      readabilityScore
    },
    warnings
  }
}