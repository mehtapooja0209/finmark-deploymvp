/**
 * Mock Helper Utilities for TypeScript Compatibility
 * 
 * Provides type-safe mock creation and response helpers to resolve
 * Jest + TypeScript compatibility issues in the test suite.
 * 
 * These utilities centralize type assertions and provide consistent
 * mock patterns across all test files, making debugging more reliable.
 */

// Generic Mock Creation Utilities
export const createTypedMock = <T>(): jest.MockedObject<T> => {
  return {} as jest.MockedObject<T>;
};

export const createMockFunction = <T extends (...args: any[]) => any>(): jest.MockedFunction<T> => {
  return jest.fn() as unknown as jest.MockedFunction<T>;
};

// Type assertion helper for complex mocks
export const asMock = <T>(mock: any): T => mock as T;

// Supabase Response Type Definitions
export interface MockSupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
  } | null;
}

// Supabase Response Helpers
export const mockSupabaseResponse = <T>(
  data: T | null, 
  error: any = null
): MockSupabaseResponse<T> => ({
  data,
  error
});

export const mockSupabaseSuccess = <T>(data: T): MockSupabaseResponse<T> => ({
  data,
  error: null
});

export const mockSupabaseError = (
  message: string, 
  code?: string,
  details?: string
): MockSupabaseResponse<null> => ({
  data: null,
  error: { message, code, details }
});

// Mock factory for method chaining (Supabase pattern)
export const createChainableMock = () => {
  const mockChain = {
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
    then: jest.fn()
  };
  
  return mockChain;
};

// Note: Supabase client is mocked globally in setup.ts
// We don't need to create a new client mock - instead work with global mock
// This avoids conflicts and circular dependencies

// Express Request/Response Mock Helpers
export const createMockRequest = (overrides: any = {}) => ({
  headers: {},
  body: {},
  params: {},
  query: {},
  user: undefined,
  ...overrides
});

export const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };
  return res;
};

// Service Mock Helpers
export const createMockAIService = () => ({
  analyzeCompliance: jest.fn(),
  analyzeMarketingCompliance: jest.fn()
});

export const createMockDocumentProcessor = () => ({
  processDocument: jest.fn(),
  extractText: jest.fn(),
  validateDocument: jest.fn()
});

export const createMockBatchProcessor = () => ({
  createBatchJob: jest.fn(),
  getBatchJobStatus: jest.fn(),
  cancelBatchJob: jest.fn(),
  getUserBatchJobs: jest.fn()
});

// Common Mock Data Factories
export const createMockUser = (overrides: any = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockDocument = (overrides: any = {}) => ({
  id: 'doc-123',
  name: 'test-document.pdf',
  file_path: 'documents/test-document.pdf',
  extracted_text: 'Sample document content for compliance testing',
  status: 'uploaded',
  user_id: 'user-123',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockAnalysisResult = (overrides: any = {}) => ({
  id: 'analysis-123',
  document_id: 'doc-123',
  user_id: 'user-123',
  compliance_score: 85,
  overall_status: 'compliant',
  violations: [],
  confidence: 0.9,
  created_at: '2023-01-01T00:00:00.000Z',
  ...overrides
});

// Type-safe mock assertion utilities
export const expectMockFunction = <T extends (...args: any[]) => any>(
  mockFn: jest.MockedFunction<T>
): jest.MockedFunction<T> => {
  expect(jest.isMockFunction(mockFn)).toBe(true);
  return mockFn;
};

export const resetAllMockHelpers = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};