import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'

// Import slices
import authSlice from './slices/authSlice'
import documentsSlice from './slices/documentsSlice'
import analysisSlice from './slices/analysisSlice'
import violationsSlice from './slices/violationsSlice'
import dashboardSlice from './slices/dashboardSlice'
import uiSlice from './slices/uiSlice'

// Import middleware
import { authMiddleware } from './middleware/authMiddleware'
import { apiErrorMiddleware } from './middleware/apiErrorMiddleware'
import { loggingMiddleware } from './middleware/loggingMiddleware'

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  documents: documentsSlice,
  analysis: analysisSlice,
  violations: violationsSlice,
  dashboard: dashboardSlice,
  ui: uiSlice
})

// Persist configuration
const persistConfig = {
  key: 'finmark-compliance-scanner',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI preferences
  blacklist: ['documents', 'analysis'], // Don't persist data that should be fresh
  version: 1
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates']
      },
      immutableCheck: {
        warnAfter: 128
      }
    }).concat([
      authMiddleware,
      apiErrorMiddleware,
      loggingMiddleware
    ]),
  devTools: import.meta.env.MODE !== 'production' && {
    name: 'AI Compliance Scanner',
    trace: true,
    traceLimit: 25,
    features: {
      pause: true,
      lock: true,
      persist: true,
      export: true,
      import: 'custom',
      jump: true,
      skip: true,
      reorder: true,
      dispatch: true,
      test: true
    }
  }
})

export const persistor = persistStore(store)

// Type definitions for useSelector and useDispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Selector helpers
export const selectAuth = (state) => state.auth
export const selectDocuments = (state) => state.documents  
export const selectAnalysis = (state) => state.analysis
export const selectViolations = (state) => state.violations
export const selectDashboard = (state) => state.dashboard
export const selectUI = (state) => state.ui

// Store subscription for real-time updates
store.subscribe(() => {
  const state = store.getState()
  
  // Handle auth state changes
  if (state.auth.token && state.auth.tokenExpiry) {
    const timeUntilExpiry = new Date(state.auth.tokenExpiry).getTime() - Date.now()
    if (timeUntilExpiry <= 0) {
      store.dispatch({ type: 'auth/logout' })
    }
  }
})

export default store