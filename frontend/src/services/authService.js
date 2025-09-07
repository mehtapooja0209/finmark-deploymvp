import { supabase } from './supabaseClient'

/**
 * Authentication service that integrates with Supabase
 */
class AuthService {
  /**
   * Sign in with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} Authentication response with session and user
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Login error:', error.message)
      throw error
    }
    
    return data
  }
  
  /**
   * Sign up with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @param {Object} metadata Additional user data
   * @returns {Promise<Object>} Registration response
   */
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    if (error) {
      console.error('Registration error:', error.message)
      throw error
    }
    
    return data
  }
  
  /**
   * Sign out the current user
   * @returns {Promise<Object>} Sign out response
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error.message)
      throw error
    }
    
    return { success: true }
  }
  
  /**
   * Get the current session
   * @returns {Promise<Object|null>} Current session or null
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Get session error:', error.message)
      throw error
    }
    
    return data.session
  }
  
  /**
   * Get the current user
   * @returns {Promise<Object|null>} Current user or null
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Get user error:', error.message)
      throw error
    }
    
    return data.user
  }
  
  /**
   * Update user profile
   * @param {Object} updates Profile updates
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(updates) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })
    
    if (error) {
      console.error('Update profile error:', error.message)
      throw error
    }
    
    return data.user
  }
  
  /**
   * Send password reset email
   * @param {string} email User email
   * @returns {Promise<Object>} Reset password response
   */
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`
    })
    
    if (error) {
      console.error('Reset password error:', error.message)
      throw error
    }
    
    return data
  }
  
  /**
   * Update user password
   * @param {string} newPassword New password
   * @returns {Promise<Object>} Update password response
   */
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error('Update password error:', error.message)
      throw error
    }
    
    return data
  }
  
  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if user is authenticated
   */
  async isAuthenticated() {
    const session = await this.getSession()
    return !!session
  }
  
  /**
   * Get the JWT access token
   * @returns {Promise<string|null>} Access token or null
   */
  async getAccessToken() {
    const session = await this.getSession()
    return session?.access_token || null
  }
  
  /**
   * Set up auth state change listener
   * @param {Function} callback Callback function
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  }
  
  /**
   * Get user role from metadata
   * @returns {Promise<string>} User role
   */
  async getUserRole() {
    const user = await this.getUser()
    return user?.user_metadata?.role || 'user'
  }
}

// Create singleton instance
const authService = new AuthService()
export default authService
