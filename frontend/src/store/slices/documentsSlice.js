import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiService } from '../../services/apiService'

// ================================
// Initial State
// ================================

const initialState = {
  entities: {}, // Normalized documents by ID
  ids: [], // Array of document IDs for ordering
  uploadQueue: [], // Active uploads with progress
  selectedDocument: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {
    status: null,
    type: null,
    dateRange: null,
    searchQuery: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  },
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

// ================================
// Async Thunks
// ================================

// Upload document
export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async ({ file, onProgress }, { dispatch, rejectWithValue }) => {
    try {
      const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Add to upload queue
      dispatch(addToUploadQueue({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
        startTime: new Date().toISOString()
      }))
      
      const formData = new FormData()
      formData.append('document', file)
      
      const response = await apiService.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          
          dispatch(updateUploadProgress({ fileId, progress }))
          onProgress?.(progress)
        }
      })
      
      // Remove from queue and add to documents
      dispatch(removeFromUploadQueue(fileId))
      
      return response.data.document
    } catch (error) {
      // Update upload queue with error status
      dispatch(updateUploadProgress({ 
        fileId, 
        status: 'error',
        errorMessage: error.response?.data?.message || error.message
      }))
      
      return rejectWithValue(
        error.response?.data?.message || 'Upload failed'
      )
    }
  }
)

// Get documents with pagination and filters
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState().documents
      const queryParams = {
        page: params.page || state.pagination.page,
        limit: params.limit || state.pagination.limit,
        sortBy: params.sortBy || state.sortBy,
        sortOrder: params.sortOrder || state.sortOrder,
        ...state.filters,
        ...params.filters
      }
      
      // Remove null/empty filters
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) delete queryParams[key]
      })
      
      const response = await apiService.get('/documents', { params: queryParams })
      
      return {
        documents: response.data.documents,
        pagination: response.data.pagination,
        params: queryParams
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch documents'
      )
    }
  }
)

// Get single document by ID
export const fetchDocument = createAsyncThunk(
  'documents/fetchDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await apiService.get(`/documents/${documentId}`)
      return response.data.document
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch document'
      )
    }
  }
)

// Delete document
export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      await apiService.delete(`/documents/${documentId}`)
      return documentId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete document'
      )
    }
  }
)

// Batch delete documents
export const batchDeleteDocuments = createAsyncThunk(
  'documents/batchDeleteDocuments',
  async (documentIds, { dispatch, rejectWithValue }) => {
    try {
      const results = []
      const errors = []
      
      for (const id of documentIds) {
        try {
          await apiService.delete(`/documents/${id}`)
          results.push(id)
        } catch (error) {
          errors.push({ id, error: error.response?.data?.message || error.message })
        }
      }
      
      return { deleted: results, errors }
    } catch (error) {
      return rejectWithValue('Batch delete operation failed')
    }
  }
)

// Search documents
export const searchDocuments = createAsyncThunk(
  'documents/searchDocuments',
  async ({ query, filters }, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/documents/search', {
        params: { q: query, ...filters }
      })
      
      return response.data.documents
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Search failed'
      )
    }
  }
)

// ================================
// Documents Slice
// ================================

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // Upload queue management
    addToUploadQueue: (state, action) => {
      state.uploadQueue.push(action.payload)
    },
    
    updateUploadProgress: (state, action) => {
      const { fileId, ...updates } = action.payload
      const uploadIndex = state.uploadQueue.findIndex(u => u.fileId === fileId)
      
      if (uploadIndex !== -1) {
        state.uploadQueue[uploadIndex] = {
          ...state.uploadQueue[uploadIndex],
          ...updates
        }
        
        // Calculate estimated time remaining
        if (updates.progress > 0) {
          const upload = state.uploadQueue[uploadIndex]
          const elapsed = Date.now() - new Date(upload.startTime).getTime()
          const estimatedTotal = (elapsed / updates.progress) * 100
          const remaining = estimatedTotal - elapsed
          
          state.uploadQueue[uploadIndex].estimatedTimeRemaining = 
            remaining > 0 ? Math.round(remaining / 1000) : 0
        }
      }
    },
    
    removeFromUploadQueue: (state, action) => {
      const fileId = action.payload
      state.uploadQueue = state.uploadQueue.filter(u => u.fileId !== fileId)
    },
    
    clearUploadQueue: (state) => {
      state.uploadQueue = []
    },
    
    // Document selection
    selectDocument: (state, action) => {
      state.selectedDocument = action.payload
    },
    
    clearSelection: (state) => {
      state.selectedDocument = null
    },
    
    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1 // Reset to first page when filters change
    },
    
    clearFilters: (state) => {
      state.filters = {
        status: null,
        type: null,
        dateRange: null,
        searchQuery: ''
      }
      state.pagination.page = 1
    },
    
    // Sorting
    setSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload
      state.sortBy = sortBy
      state.sortOrder = sortOrder
      state.pagination.page = 1
    },
    
    // Pagination
    setPage: (state, action) => {
      state.pagination.page = action.payload
    },
    
    setPageSize: (state, action) => {
      state.pagination.limit = action.payload
      state.pagination.page = 1
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null
    },
    
    // Update document in place (for real-time updates)
    updateDocument: (state, action) => {
      const document = action.payload
      if (state.entities[document.id]) {
        state.entities[document.id] = { ...state.entities[document.id], ...document }
        state.lastUpdated = new Date().toISOString()
      }
    },
    
    // Batch update documents
    batchUpdateDocuments: (state, action) => {
      const updates = action.payload
      updates.forEach(update => {
        if (state.entities[update.id]) {
          state.entities[update.id] = { ...state.entities[update.id], ...update }
        }
      })
      state.lastUpdated = new Date().toISOString()
    }
  },
  
  extraReducers: (builder) => {
    // Upload document cases
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.isLoading = false
        const document = action.payload
        
        // Add to normalized entities
        state.entities[document.id] = document
        
        // Add to IDs array if not already present
        if (!state.ids.includes(document.id)) {
          state.ids.unshift(document.id) // Add to beginning
        }
        
        state.lastUpdated = new Date().toISOString()
        state.pagination.total += 1
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Fetch documents cases
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        const { documents, pagination } = action.payload
        
        // Normalize documents
        const newEntities = {}
        const newIds = []
        
        documents.forEach(doc => {
          newEntities[doc.id] = doc
          newIds.push(doc.id)
        })
        
        // Replace or append based on pagination
        if (pagination.page === 1) {
          state.entities = newEntities
          state.ids = newIds
        } else {
          // Append to existing (infinite scroll)
          state.entities = { ...state.entities, ...newEntities }
          state.ids = [...state.ids, ...newIds.filter(id => !state.ids.includes(id))]
        }
        
        state.pagination = pagination
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Fetch single document cases
    builder
      .addCase(fetchDocument.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.isLoading = false
        const document = action.payload
        
        state.entities[document.id] = document
        if (!state.ids.includes(document.id)) {
          state.ids.push(document.id)
        }
        
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Delete document cases
    builder
      .addCase(deleteDocument.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.isLoading = false
        const documentId = action.payload
        
        // Remove from entities and IDs
        delete state.entities[documentId]
        state.ids = state.ids.filter(id => id !== documentId)
        
        // Clear selection if deleted document was selected
        if (state.selectedDocument === documentId) {
          state.selectedDocument = null
        }
        
        state.pagination.total = Math.max(0, state.pagination.total - 1)
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Batch delete cases
    builder
      .addCase(batchDeleteDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(batchDeleteDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        const { deleted, errors } = action.payload
        
        // Remove successfully deleted documents
        deleted.forEach(id => {
          delete state.entities[id]
          state.ids = state.ids.filter(docId => docId !== id)
        })
        
        // Clear selection if any selected document was deleted
        if (deleted.includes(state.selectedDocument)) {
          state.selectedDocument = null
        }
        
        state.pagination.total = Math.max(0, state.pagination.total - deleted.length)
        state.lastUpdated = new Date().toISOString()
        
        // Set error if there were any failures
        if (errors.length > 0) {
          state.error = `Failed to delete ${errors.length} document(s)`
        }
      })
      .addCase(batchDeleteDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Search documents cases
    builder
      .addCase(searchDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        const documents = action.payload
        
        // Replace current documents with search results
        const newEntities = {}
        const newIds = []
        
        documents.forEach(doc => {
          newEntities[doc.id] = doc
          newIds.push(doc.id)
        })
        
        state.entities = newEntities
        state.ids = newIds
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(searchDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

// ================================
// Selectors
// ================================

export const selectDocuments = (state) => state.documents
export const selectAllDocuments = (state) => 
  state.documents.ids.map(id => state.documents.entities[id])

export const selectDocumentById = (state, documentId) => 
  state.documents.entities[documentId]

export const selectSelectedDocument = (state) => 
  state.documents.selectedDocument ? 
    state.documents.entities[state.documents.selectedDocument] : 
    null

export const selectUploadQueue = (state) => state.documents.uploadQueue
export const selectDocumentFilters = (state) => state.documents.filters
export const selectDocumentPagination = (state) => state.documents.pagination
export const selectDocumentsLoading = (state) => state.documents.isLoading
export const selectDocumentsError = (state) => state.documents.error

// Filtered documents selector
export const selectFilteredDocuments = (state) => {
  const { entities, ids, filters } = state.documents
  const documents = ids.map(id => entities[id])
  
  return documents.filter(doc => {
    if (filters.status && doc.status !== filters.status) return false
    if (filters.type && doc.type !== filters.type) return false
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      if (!doc.name.toLowerCase().includes(query) && 
          !doc.originalName.toLowerCase().includes(query)) {
        return false
      }
    }
    if (filters.dateRange) {
      const docDate = new Date(doc.createdAt)
      const start = new Date(filters.dateRange.start)
      const end = new Date(filters.dateRange.end)
      if (docDate < start || docDate > end) return false
    }
    return true
  })
}

// Documents by status
export const selectDocumentsByStatus = (state) => {
  const documents = selectAllDocuments(state)
  return documents.reduce((acc, doc) => {
    if (!acc[doc.status]) acc[doc.status] = []
    acc[doc.status].push(doc)
    return acc
  }, {})
}

// Upload progress selector
export const selectActiveUploads = (state) => 
  state.documents.uploadQueue.filter(upload => 
    upload.status === 'uploading' || upload.status === 'processing'
  )

export const selectCompletedUploads = (state) =>
  state.documents.uploadQueue.filter(upload => upload.status === 'completed')

export const selectFailedUploads = (state) =>
  state.documents.uploadQueue.filter(upload => upload.status === 'error')

// Export actions
export const {
  addToUploadQueue,
  updateUploadProgress,
  removeFromUploadQueue,
  clearUploadQueue,
  selectDocument,
  clearSelection,
  setFilters,
  clearFilters,
  setSorting,
  setPage,
  setPageSize,
  clearError,
  updateDocument,
  batchUpdateDocuments
} = documentsSlice.actions

export default documentsSlice.reducer