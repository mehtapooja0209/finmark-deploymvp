import pdfParse from 'pdf-parse'
import { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import { supabase } from '../config/supabase'

export class DocumentProcessor {
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer)
      return data.text
    } catch (error) {
      console.error('PDF text extraction error:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      // Enhance image quality for better OCR results
      const processedImage = await sharp(buffer)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: false
        })
        .sharpen()
        .normalize()
        .greyscale()
        .png()
        .toBuffer()

      return processedImage
    } catch (error) {
      console.error('Image preprocessing error:', error)
      // Return original buffer if preprocessing fails
      return buffer
    }
  }

  async extractTextFromImage(buffer: Buffer): Promise<{ 
    text: string, 
    confidence: number 
  }> {
    const worker = await createWorker('eng')
    
    try {
      // Preprocess image for better OCR
      const processedBuffer = await this.preprocessImage(buffer)
      
      // Configure Tesseract for marketing document analysis
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()%-:;@#$&* ',
        preserve_interword_spaces: '1'
      })
      
      const { data } = await worker.recognize(processedBuffer)
      
      // Calculate average confidence
      const confidence = data.confidence / 100 // Convert to 0-1 scale
      
      // Clean up extracted text
      let cleanedText = data.text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
        .trim()
      
      console.log(`OCR completed with ${confidence.toFixed(2)} confidence`)
      
      return {
        text: cleanedText,
        confidence
      }
    } catch (error) {
      console.error('OCR text extraction error:', error)
      throw new Error('Failed to extract text from image using OCR')
    } finally {
      await worker.terminate()
    }
  }

  private isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/')
  }

  private getDocumentType(mimetype: string): string {
    const mimeTypeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    }
    
    return mimeTypeMap[mimetype] || mimetype
  }

  async uploadToSupabase(file: Express.Multer.File, userId: string): Promise<string> {
    try {
      const fileName = `${userId}/${Date.now()}-${file.originalname}`
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600'
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error('Failed to upload file to storage')
    }
  }

  async processDocument(file: Express.Multer.File, userId: string) {
    try {
      // Upload file to Supabase Storage
      const fileUrl = await this.uploadToSupabase(file, userId)
      
      // Extract text based on file type
      let extractedText: string | null = null
      let ocrConfidence: number | null = null
      
      if (file.mimetype === 'application/pdf') {
        extractedText = await this.extractTextFromPDF(file.buffer)
      } else if (this.isImageFile(file.mimetype)) {
        const ocrResult = await this.extractTextFromImage(file.buffer)
        extractedText = ocrResult.text
        ocrConfidence = ocrResult.confidence
        
        // Log OCR quality warning if confidence is low
        if (ocrConfidence < 0.7) {
          console.warn(`Low OCR confidence (${(ocrConfidence * 100).toFixed(1)}%) for file: ${file.originalname}`)
        }
      }

      // Save document metadata to database
      const documentData = {
        name: file.originalname,
        original_name: file.originalname,
        type: this.getDocumentType(file.mimetype),
        size: file.size,
        url: fileUrl,
        status: 'uploaded' as const,
        extracted_text: extractedText,
        user_id: userId,
        // Store OCR confidence in metadata if applicable
        ...(ocrConfidence !== null && {
          // Note: We'd need to add a metadata column to store this properly
          // For now, we'll include it in a future enhancement
        })
      }

      const { data: document, error } = await supabase
        .from('documents')
        .insert(documentData as any)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Add OCR confidence info to the returned document if applicable
      if (ocrConfidence !== null) {
        (document as any).ocr_confidence = ocrConfidence
      }

      return document
    } catch (error) {
      console.error('Document processing error:', error)
      throw error
    }
  }
}