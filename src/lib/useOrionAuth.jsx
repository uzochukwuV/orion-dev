/**
 * Orion Auth Context - JWT-based authentication
 * 
 * Replaces Clerk with our custom email/password auth.
 * Handles login, logout, and auth state management.
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get token from localStorage or cookie
      const storedToken = localStorage.getItem('orion_token');
      
      if (storedToken) {
        setToken(storedToken);
        
        // Verify token and get user data
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setBusiness(data.business);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('orion_token');
          setToken(null);
          setUser(null);
          setBusiness(null);
        }
      } else {
        setToken(null);
        setUser(null);
        setBusiness(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to check authentication');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Include cookies
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store token
      localStorage.setItem('orion_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setBusiness(data.business);
      
      return { success: true, user: data.user, business: data.business };
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Store token
      localStorage.setItem('orion_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setBusiness(data.business);
      
      return { success: true, user: data.user, business: data.business };
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('orion_token');
      setToken(null);
      setUser(null);
      setBusiness(null);
    }
  }, []);

  const refreshBusiness = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setBusiness(data.business);
        return data.business;
      }
    } catch (err) {
      console.error('Failed to refresh business:', err);
    }
    return null;
  }, [token]);

  const value = {
    user,
    business,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    checkAuth,
    refreshBusiness,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get auth headers for API calls
export function getAuthHeaders() {
  const token = localStorage.getItem('orion_token');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}