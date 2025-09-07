import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { DocumentProcessor } from './document-processor'
import pdfParse from 'pdf-parse'
import { supabase } from '../config/supabase'

// Mock dependencies
jest.mock('pdf-parse')
jest.mock('../config/supabase')

const mockPdfParse = pdfParse as jest.MockedFunction<typeof pdfParse>

const mockSupabase = {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn() as jest.MockedFunction<any>,
      getPublicUrl: jest.fn() as jest.MockedFunction<any>,
    })),
  },
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn() as jest.MockedFunction<any>,
  })),
}

// Mock console to avoid test output noise
const mockConsole = {
  error: jest.fn(),
  log: jest.fn(),
}

describe('DocumentProcessor', () => {
  let documentProcessor: DocumentProcessor
  let mockFile: Express.Multer.File

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock supabase
    Object.assign(supabase, mockSupabase)
    
    // Mock console
    global.console = mockConsole as any

    documentProcessor = new DocumentProcessor()

    // Create mock file
    mockFile = {
      fieldname: 'document',
      originalname: 'test-document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024000,
      buffer: Buffer.from('fake PDF content'),
      destination: '',
      filename: '',
      path: '',
      stream: {} as any,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('extractTextFromPDF', () => {
    test('should successfully extract text from PDF buffer', async () => {
      const mockExtractedText = 'This is extracted text from the PDF document.'
      
      mockPdfParse.mockResolvedValueOnce({
        text: mockExtractedText,
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: '1.0'
      })

      const result = await documentProcessor.extractTextFromPDF(mockFile.buffer)

      expect(result).toBe(mockExtractedText)
      expect(mockPdfParse).toHaveBeenCalledWith(mockFile.buffer)
    })

    test('should throw error when PDF parsing fails', async () => {
      const mockError = new Error('Invalid PDF format')
      mockPdfParse.mockRejectedValueOnce(mockError)

      await expect(
        documentProcessor.extractTextFromPDF(mockFile.buffer)
      ).rejects.toThrow('Failed to extract text from PDF')

      expect(mockConsole.error).toHaveBeenCalledWith('PDF text extraction error:', mockError)
    })

    test('should handle corrupted PDF files', async () => {
      const corruptedBuffer = Buffer.from('corrupted data')
      mockPdfParse.mockRejectedValueOnce(new Error('PDF is corrupted'))

      await expect(
        documentProcessor.extractTextFromPDF(corruptedBuffer)
      ).rejects.toThrow('Failed to extract text from PDF')
    })
  })

  describe('uploadToSupabase', () => {
    test('should successfully upload file to Supabase storage', async () => {
      const mockFileUrl = 'https://supabase.co/storage/v1/object/public/documents/user-123/1234567890-test-document.pdf'
      const mockFileName = 'user-123/1234567890-test-document.pdf'

      // Mock Date.now() for consistent filename
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890000)

      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: { path: mockFileName },
        error: null,
      })

      ;(mockSupabase.storage.from() as any).getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: mockFileUrl },
      })

      const result = await documentProcessor.uploadToSupabase(mockFile, 'user-123')

      expect(result).toBe(mockFileUrl)
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents')
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        'user-123/1234567890000-test-document.pdf',
        mockFile.buffer,
        {
          contentType: 'application/pdf',
          cacheControl: '3600'
        }
      )

      mockDateNow.mockRestore()
    })

    test('should throw error when upload fails', async () => {
      const mockError = { message: 'Storage quota exceeded' }
      
      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: null,
        error: mockError,
      })

      await expect(
        documentProcessor.uploadToSupabase(mockFile, 'user-123')
      ).rejects.toThrow('Failed to upload file to storage')

      expect(mockConsole.error).toHaveBeenCalledWith('File upload error:', expect.any(Error))
    })

    test('should handle network errors during upload', async () => {
      ;(mockSupabase.storage.from() as any).upload.mockRejectedValueOnce(
        new Error('Network connection failed')
      )

      await expect(
        documentProcessor.uploadToSupabase(mockFile, 'user-123')
      ).rejects.toThrow('Failed to upload file to storage')
    })

    test('should create filename with correct format', async () => {
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(9876543210000)

      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: { path: 'test-path' },
        error: null,
      })

      ;(mockSupabase.storage.from() as any).getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: 'test-url' },
      })

      await documentProcessor.uploadToSupabase(mockFile, 'user-456')

      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        'user-456/9876543210000-test-document.pdf',
        expect.any(Buffer),
        expect.any(Object)
      )

      mockDateNow.mockRestore()
    })
  })

  describe('processDocument', () => {
    test('should successfully process PDF document', async () => {
      const mockExtractedText = 'PDF content text'
      const mockFileUrl = 'https://supabase.co/storage/test-file.pdf'
      const mockDocument = {
        id: 'doc-123',
        name: 'test-document.pdf',
        original_name: 'test-document.pdf',
        type: 'application/pdf',
        size: 1024000,
        url: mockFileUrl,
        status: 'uploaded',
        extracted_text: mockExtractedText,
        user_id: 'user-123',
      }

      // Mock PDF parsing
      mockPdfParse.mockResolvedValueOnce({
        text: mockExtractedText,
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: '1.0'
      })

      // Mock file upload
      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: { path: 'test-path' },
        error: null,
      })
      ;(mockSupabase.storage.from() as any).getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: mockFileUrl },
      })

      // Mock database insert
      ;(mockSupabase.from() as any).single.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      })

      const result = await documentProcessor.processDocument(mockFile, 'user-123')

      expect(result).toEqual(mockDocument)
      expect(mockPdfParse).toHaveBeenCalledWith(mockFile.buffer)
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        name: 'test-document.pdf',
        original_name: 'test-document.pdf',
        type: 'application/pdf',
        size: 1024000,
        url: mockFileUrl,
        status: 'uploaded',
        extracted_text: mockExtractedText,
        user_id: 'user-123',
      })
    })

    test('should process non-PDF file without text extraction', async () => {
      const mockImageFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
      }

      const mockFileUrl = 'https://supabase.co/storage/test-image.jpg'
      const mockDocument = {
        id: 'doc-456',
        name: 'test-image.jpg',
        original_name: 'test-image.jpg',
        type: 'image/jpeg',
        size: 1024000,
        url: mockFileUrl,
        status: 'uploaded',
        extracted_text: null,
        user_id: 'user-123',
      }

      // Mock file upload
      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: { path: 'test-path' },
        error: null,
      })
      ;(mockSupabase.storage.from() as any).getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: mockFileUrl },
      })

      // Mock database insert
      ;(mockSupabase.from() as any).single.mockResolvedValueOnce({
        data: mockDocument,
        error: null,
      })

      const result = await documentProcessor.processDocument(mockImageFile, 'user-123')

      expect(result).toEqual(mockDocument)
      expect(mockPdfParse).not.toHaveBeenCalled()
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          extracted_text: null,
        })
      )
    })

    test('should handle database insertion errors', async () => {
      const mockFileUrl = 'https://supabase.co/storage/test-file.pdf'
      const mockDatabaseError = { message: 'Unique constraint violation' }

      // Mock successful upload
      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: { path: 'test-path' },
        error: null,
      })
      ;(mockSupabase.storage.from() as any).getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: mockFileUrl },
      })

      // Mock successful text extraction
      mockPdfParse.mockResolvedValueOnce({
        text: 'extracted text',
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: '1.0'
      })

      // Mock database error
      ;(mockSupabase.from() as any).single.mockResolvedValueOnce({
        data: null,
        error: mockDatabaseError,
      })

      await expect(
        documentProcessor.processDocument(mockFile, 'user-123')
      ).rejects.toThrow('Database error: Unique constraint violation')
    })

    test('should handle upload failure during document processing', async () => {
      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' },
      })

      await expect(
        documentProcessor.processDocument(mockFile, 'user-123')
      ).rejects.toThrow('Failed to upload file to storage')
    })

    test('should handle PDF parsing errors during document processing', async () => {
      const mockFileUrl = 'https://supabase.co/storage/test-file.pdf'

      // Mock successful upload
      ;(mockSupabase.storage.from() as any).upload.mockResolvedValueOnce({
        data: { path: 'test-path' },
        error: null,
      })
      ;(mockSupabase.storage.from() as any).getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: mockFileUrl },
      })

      // Mock PDF parsing failure
      mockPdfParse.mockRejectedValueOnce(new Error('Corrupted PDF'))

      await expect(
        documentProcessor.processDocument(mockFile, 'user-123')
      ).rejects.toThrow('Failed to extract text from PDF')
    })

    test('should propagate errors from nested operations', async () => {
      const mockError = new Error('Unexpected error during processing')

      // Mock upload to throw error
      ;(mockSupabase.storage.from() as any).upload.mockRejectedValueOnce(mockError)

      await expect(
        documentProcessor.processDocument(mockFile, 'user-123')
      ).rejects.toThrow('Unexpected error during processing')

      expect(mockConsole.error).toHaveBeenCalledWith('Document processing error:', mockError)
    })
  })
})