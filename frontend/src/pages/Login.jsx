import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      setMessage("You are already logged in. Redirecting...");
      setTimeout(() => navigate(from, { replace: true }), 1500);
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      await login(email, password);
      setMessage("Login successful! Redirecting...");
    } catch {
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="hs-card max-w-md w-full">
        <div className="mb-8 text-center">
          <h2 className="hs-heading-lg text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-600">
            Don't have an account?{" "}
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
            <p className="text-sm text-gray-500 mt-2">
              Redirecting to your previous page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-2"
              >
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
              <label
                htmlFor="password"
                className="block text-gray-700 font-medium mb-2"
              >
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

            <button type="submit" className="hs-btn hs-btn-primary w-full">
              Sign In
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            For demo purposes: Use email "demo@example.com" and password
            "password123"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 