import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Create a wrapper that logs token handling
const tokenStorage = {
  getToken: () => {
    const token = localStorage.getItem('token');
    console.log('Retrieved token from storage:', token ? 'Token exists' : 'No token');
    return token;
  },
  setToken: (token) => {
    if (token) {
      console.log('Storing token in localStorage');
      localStorage.setItem('token', token);
    } else {
      console.log('Removing token from localStorage');
      localStorage.removeItem('token');
    }
  },
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(tokenStorage.getToken());
  const [user, setUserState] = useState(tokenStorage.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Wrapper for setting token that updates both state and localStorage
  const setToken = (newToken) => {
    console.log('Setting token:', newToken ? 'Token provided' : 'Clearing token');
    tokenStorage.setToken(newToken);
    setTokenState(newToken);
  };

  // Wrapper for setting user that updates both state and localStorage
  const setUser = (newUser) => {
    tokenStorage.setUser(newUser);
    setUserState(newUser);
  };

  // Listen for localStorage changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        console.log('Token changed in another tab');
        setTokenState(e.newValue);
      } else if (e.key === 'user') {
        try {
          setUserState(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (err) {
          console.error('Error parsing user from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check token validity on mount and when token changes
  useEffect(() => {
    const validateToken = async () => {
      // Only attempt validation if there's a token
      if (!token) {
        console.log('No token to validate');
        return;
      }

      try {
        // Make an API call to validate the token
        const response = await api.get('/auth/me');
        
        // If successful, update user data
        console.log('Token validated successfully');
        setUser(response.data.user);
        
        // Make sure token is correctly stored in localStorage (as a safety check)
        if (token !== localStorage.getItem('token')) {
          console.warn('Token mismatch between state and localStorage, fixing...');
          tokenStorage.setToken(token);
        }
      } catch (err) {
        // If validation fails, clear token and user
        console.error('Token validation failed:', err);
        setToken(null);
        setUser(null);
      }
    };

    validateToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Make a real API call to the backend
      const response = await api.post('/auth/login', { email, password });
      
      console.log('Login successful, setting user and token');
      setUser(response.data.user);
      setToken(response.data.token);
      setError(null);
      
      return response.data.user;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, username) => {
    try {
      setLoading(true);
      
      // Make a real API call to the backend
      const response = await api.post('/auth/register', { name, email, password, username });
      
      console.log('Registration successful, setting user and token');
      setUser(response.data.user);
      setToken(response.data.token);
      setError(null);
      
      return response.data.user;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // In a real app with a backend endpoint for logout, you would call it here
    // api.post('/auth/logout').catch(err => console.error('Logout API error:', err));
    
    // Clear token and user data from localStorage and state
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!token, // Convenience boolean for checking auth status
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;