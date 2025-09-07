import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  withCredentials: true // This enables cookies to be sent with requests
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // TEMPORARILY DISABLED FOR TESTING - MOCK AUTHENTICATED USER
  const [user, setUser] = useState({
    id: 'test-user-123',
    email: 'test@compliance.com',
    role: 'admin',
    name: 'Test User'
  });
  const [loading, setLoading] = useState(false); // No loading for testing
  const [accessToken, setAccessToken] = useState('mock-token-123');

  // TEMPORARILY DISABLED FOR TESTING - Set up axios interceptor to add auth token to requests
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // TEMPORARILY DISABLED - NO AUTH TOKEN SENT
        // if (accessToken) {
        //   config.headers.Authorization = `Bearer ${accessToken}`;
        // }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // TEMPORARILY DISABLED FOR TESTING - Set up response interceptor to handle token expiration
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // TEMPORARILY DISABLED - NO TOKEN REFRESH/LOGOUT ON 401
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  // TEMPORARILY DISABLED FOR TESTING - Load user from token on app start
  useEffect(() => {
    // NO INITIALIZATION NEEDED - USER ALREADY MOCKED
    // const initializeAuth = async () => {
    //   const token = localStorage.getItem('access_token');
    //   if (token) {
    //     setAccessToken(token);
    //     try {
    //       const response = await api.get('/auth/me');
    //       setUser(response.data.data.user);
    //     } catch (error) {
    //       console.error('Failed to load user:', error);
    //       localStorage.removeItem('access_token');
    //     }
    //   }
    //   setLoading(false);
    // };
    // initializeAuth();
  }, []);

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);
      const { user: newUser, session } = response.data.data;
      
      setUser(newUser);
      setAccessToken(session.access_token);
      localStorage.setItem('access_token', session.access_token);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', credentials);
      const { user: loggedInUser, session } = response.data.data;
      
      setUser(loggedInUser);
      setAccessToken(session.access_token);
      localStorage.setItem('access_token', session.access_token);
      
      return { success: true, user: loggedInUser };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('access_token');
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { user: refreshedUser, session } = response.data.data;
      
      setUser(refreshedUser);
      setAccessToken(session.access_token);
      localStorage.setItem('access_token', session.access_token);
      
      return session.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data.user;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  };

  const isAuthenticated = () => {
    // TEMPORARILY DISABLED FOR TESTING - ALWAYS RETURN TRUE
    return true;
  };

  const hasRole = (role) => {
    // TEMPORARILY DISABLED FOR TESTING - ALWAYS RETURN TRUE FOR ADMIN
    return true;
  };

  const hasAnyRole = (roles) => {
    // TEMPORARILY DISABLED FOR TESTING - ALWAYS RETURN TRUE
    return true;
  };

  const value = {
    user,
    loading,
    accessToken,
    register,
    login,
    logout,
    refreshToken,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    api // Export the configured axios instance for use in other components
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;