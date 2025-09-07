import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/authService'

// ================================
// Initial State
// ================================

const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  lastActivity: null,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  lastUpdated: null
}

// ================================
// Async Thunks
// ================================

// Login user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authService.signIn(email, password)
      return data
    } catch (error) {
      return rejectWithValue(
        error.message || 'Login failed'
      )
    }
  }
)

// Register user  
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authService.signUp(
        userData.email, 
        userData.password, 
        {
          full_name: userData.fullName,
          organization: userData.organization,
          role: userData.role || 'user'
        }
      )
      return data
    } catch (error) {
      return rejectWithValue(
        error.message || 'Registration failed'
      )
    }
  }
)

// Get user profile
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getUser()
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to fetch profile'
      )
    }
  }
)

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates, { rejectWithValue }) => {
    try {
      return await authService.updateProfile(updates)
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to update profile'
      )
    }
  }
)

// Change password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ newPassword }, { rejectWithValue }) => {
    try {
      return await authService.updatePassword(newPassword)
    } catch (error) {
      return rejectWithValue(
        error.message || 'Password change failed'
      )
    }
  }
)

// Forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      return await authService.resetPassword(email)
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to send reset email'
      )
    }
  }
)

// ================================
// Auth Slice
// ================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Logout action
    logout: (state) => {
      authService.signOut()
      return initialState
    },
    
    // Clear auth error
    clearError: (state) => {
      state.error = null
    },
    
    // Update last activity
    updateActivity: (state) => {
      state.lastActivity = new Date().toISOString()
    },
    
    // Set session
    setSession: (state, action) => {
      const session = action.payload
      
      if (session) {
        state.session = session
        state.user = session.user
        state.isAuthenticated = true
        state.lastActivity = new Date().toISOString()
        state.lastUpdated = new Date().toISOString()
      } else {
        state.session = null
        state.user = null
        state.isAuthenticated = false
      }
    },
    
    // Update user data
    updateUserData: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        }
        state.lastUpdated = new Date().toISOString()
      }
    },
    
    // Update user preferences
    updatePreferences: (state, action) => {
      if (state.user) {
        state.user.user_metadata = {
          ...state.user.user_metadata,
          preferences: {
            ...(state.user.user_metadata?.preferences || {}),
            ...action.payload
          }
        }
      }
    }
  },
  
  extraReducers: (builder) => {
    // Login cases
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        state.session = action.payload.session
        state.user = action.payload.user
        state.isAuthenticated = true
        state.loginAttempts = 0
        state.lastActivity = new Date().toISOString()
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.loginAttempts += 1
        state.isAuthenticated = false
        state.user = null
        state.session = null
      })
      
    // Register cases
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        // Registration successful - user may need to verify email depending on settings
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Get profile cases
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = !!action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Update profile cases
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Change password cases
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
    // Forgot password cases
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

// ================================
// Selectors
// ================================

export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectSession = (state) => state.auth.session
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthError = (state) => state.auth.error
export const selectAuthLoading = (state) => state.auth.isLoading
export const selectUserRole = (state) => state.auth.user?.user_metadata?.role || 'user'
export const selectUserPreferences = (state) => state.auth.user?.user_metadata?.preferences || {}
export const selectLoginAttempts = (state) => state.auth.loginAttempts
export const selectSessionTimeout = (state) => state.auth.sessionTimeout
export const selectLastActivity = (state) => state.auth.lastActivity

// Complex selectors
export const selectIsSessionExpired = (state) => {
  const { lastActivity, sessionTimeout } = state.auth
  if (!lastActivity) return false
  
  const now = new Date().getTime()
  const lastActivityTime = new Date(lastActivity).getTime()
  return (now - lastActivityTime) > sessionTimeout
}

export const selectTokenExpiry = (state) => {
  const { session } = state.auth
  if (!session?.expires_at) return null
  return new Date(session.expires_at * 1000) // Convert seconds to milliseconds
}

export const selectIsTokenExpired = (state) => {
  const expiry = selectTokenExpiry(state)
  if (!expiry) return true
  return expiry <= new Date()
}

// Export actions
export const {
  logout,
  clearError,
  updateActivity,
  setSession,
  updateUserData,
  updatePreferences
} = authSlice.actions

export default authSlice.reducer