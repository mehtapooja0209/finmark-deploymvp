import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '../store'
import { setAuthFromStorage, getUserProfile } from '../store/slices/authSlice'
import ErrorBoundary from '../components/ErrorBoundary'

/**
 * Redux Provider with persistence and initialization
 */
const ReduxProvider = ({ children }) => {
  useEffect(() => {
    // Initialize auth state from localStorage
    store.dispatch(setAuthFromStorage())
    
    // If token exists, fetch user profile
    const token = localStorage.getItem('authToken')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    
    if (token && tokenExpiry) {
      const expiry = new Date(tokenExpiry)
      if (expiry > new Date()) {
        store.dispatch(getUserProfile())
      }
    }
  }, [])

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Application Error
            </h2>
            <p className="text-muted-foreground mb-4">
              Something went wrong with the application state.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Reload Application
            </button>
          </div>
        </div>
      }
    >
      <Provider store={store}>
        <PersistGate 
          loading={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading application...</p>
              </div>
            </div>
          } 
          persistor={persistor}
        >
          {children}
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  )
}

export default ReduxProvider