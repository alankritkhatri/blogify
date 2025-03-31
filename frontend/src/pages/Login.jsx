import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { login, loading, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      setMessage('You are already logged in. Redirecting...');
      
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      await login(email, password);
      setMessage('Login successful! Redirecting...');
      
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="hs-card max-w-md w-full">
        <div className="mb-8 text-center">
          <h2 className="hs-heading-lg text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium">
              Create one now
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-xl">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-xl">
            {message}
          </div>
        )}
        
        {isAuthenticated ? (
          <div className="text-center p-4">
            <p>You are already logged in as {email}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to your previous page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hs-input"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hs-input"
                placeholder="••••••••"
                required
              />
              <div className="mt-1 text-right">
                <Link to="/forgot-password" className="text-sm text-primary">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="hs-btn hs-btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            For demo purposes: Use email "demo@example.com" and password "password123"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 