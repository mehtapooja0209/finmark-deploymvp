import { supabase, supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'

export interface RegisterData {
  email: string
  password: string
  role?: string
  firstName?: string
  lastName?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    role: string
    firstName?: string
    lastName?: string
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
    expires_in: number
  }
}

export interface RefreshTokenData {
  refresh_token: string
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const { email, password, role = 'user', firstName, lastName } = data

      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email format')
      }

      // Validate password strength
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }

      // Check if user already exists
      const { data: existingUser } = await supabase.auth.getUser()
      
      // Use admin client for user creation
      if (!supabaseAdmin) {
        throw new Error('Admin client not configured')
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for now
        user_metadata: {
          role,
          firstName,
          lastName
        }
      })

      if (authError) {
        logger.error('User registration failed:', authError)
        throw new Error(authError.message || 'Registration failed')
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Create user role in database
      try {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: role as any,
            is_active: true
          })

        if (roleError) {
          logger.warn('Failed to create user role:', roleError)
          // Don't fail registration if role creation fails
        }
      } catch (roleErr) {
        logger.warn('Role creation error:', roleErr)
      }

      // Sign in the user to get tokens
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError || !signInData.session || !signInData.user) {
        throw new Error('Registration successful but auto-login failed')
      }

      logger.info('User registered successfully:', {
        userId: authData.user.id,
        email: authData.user.email,
        role
      })

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
          role,
          firstName,
          lastName
        },
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_at: signInData.session.expires_at || 0,
          expires_in: signInData.session.expires_in || 3600
        }
      }
    } catch (error) {
      logger.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const { email, password } = data

      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // Sign in with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        logger.error('Login failed:', signInError)
        throw new Error(signInError.message || 'Invalid credentials')
      }

      if (!signInData.session || !signInData.user) {
        throw new Error('Login failed - no session created')
      }

      // Get user role from database
      let userRole = 'user'
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id)
          .eq('is_active', true)
          .single()

        if (roleData) {
          userRole = roleData.role
        }
      } catch (roleError) {
        logger.warn('Failed to fetch user role:', roleError)
        // Use role from metadata as fallback
        userRole = signInData.user.user_metadata?.role || 'user'
      }

      logger.info('User logged in successfully:', {
        userId: signInData.user.id,
        email: signInData.user.email,
        role: userRole
      })

      return {
        user: {
          id: signInData.user.id,
          email: signInData.user.email || email,
          role: userRole,
          firstName: signInData.user.user_metadata?.firstName,
          lastName: signInData.user.user_metadata?.lastName
        },
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_at: signInData.session.expires_at || 0,
          expires_in: signInData.session.expires_in || 3600
        }
      }
    } catch (error) {
      logger.error('Login error:', error)
      throw error
    }
  }

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    try {
      const { error } = await supabase.auth.admin.signOut(accessToken)
      if (error) {
        logger.warn('Logout error:', error)
      }
      logger.info('User logged out successfully')
    } catch (error) {
      logger.error('Logout error:', error)
      // Don't throw error for logout failures
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenData): Promise<AuthResponse> {
    try {
      const { refresh_token } = data

      if (!refresh_token) {
        throw new Error('Refresh token is required')
      }

      const { data: refreshData, error } = await supabase.auth.refreshSession({
        refresh_token
      })

      if (error || !refreshData.session || !refreshData.user) {
        logger.error('Token refresh failed:', error)
        throw new Error('Invalid or expired refresh token')
      }

      // Get user role
      let userRole = 'user'
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', refreshData.user.id)
          .eq('is_active', true)
          .single()

        if (roleData) {
          userRole = roleData.role
        }
      } catch (roleError) {
        userRole = refreshData.user.user_metadata?.role || 'user'
      }

      logger.info('Token refreshed successfully:', {
        userId: refreshData.user.id,
        email: refreshData.user.email
      })

      return {
        user: {
          id: refreshData.user.id,
          email: refreshData.user.email || '',
          role: userRole,
          firstName: refreshData.user.user_metadata?.firstName,
          lastName: refreshData.user.user_metadata?.lastName
        },
        session: {
          access_token: refreshData.session.access_token,
          refresh_token: refreshData.session.refresh_token,
          expires_at: refreshData.session.expires_at || 0,
          expires_in: refreshData.session.expires_in || 3600
        }
      }
    } catch (error) {
      logger.error('Token refresh error:', error)
      throw error
    }
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(accessToken: string): Promise<AuthResponse['user']> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)

      if (error || !user) {
        throw new Error('Invalid or expired token')
      }

      // Get user role
      let userRole = 'user'
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (roleData) {
          userRole = roleData.role
        }
      } catch (roleError) {
        userRole = user.user_metadata?.role || 'user'
      }

      return {
        id: user.id,
        email: user.email || '',
        role: userRole,
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName
      }
    } catch (error) {
      logger.error('Get current user error:', error)
      throw error
    }
  }
}

export const authService = new AuthService()