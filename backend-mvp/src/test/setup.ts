import { jest } from '@jest/globals'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Set up global mocks
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  // Chainable query builder mock (mirrors Supabase pattern)
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  }

  const storageFrom = {
    upload: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
    getPublicUrl: jest.fn((path?: string) => ({
      data: { publicUrl: `https://storage.test/${path || 'file.pdf'}` },
      error: null,
    })),
  }

  const mockSupabaseClient = {
    from: jest.fn(() => chain),
    storage: {
      from: jest.fn(() => storageFrom),
    },
    auth: {
      getUser: jest.fn(),
    },
  }

  ;(global as any).mockSupabaseClient = mockSupabaseClient

  return {
    createClient: jest.fn(() => mockSupabaseClient),
  }
})

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(() =>
        Promise.resolve({
          response: {
            text: () => JSON.stringify({
              compliance_score: 85,
              violations: [],
              recommendations: [],
            }),
          },
        })
      ),
    })),
  })),
}))

// Global test timeout
jest.setTimeout(30000)

// Setup environment variables for tests
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.GOOGLE_AI_API_KEY = 'test-ai-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.PORT = '3001'