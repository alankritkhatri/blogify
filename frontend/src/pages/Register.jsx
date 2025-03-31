import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();
    const getCommonStyles = () => ({
  button: "rounded-lg py-2 px-5 text-base font-medium transition-colors",
  buttonPrimary: "bg-primary hover:bg-primary-dark text-white",
  buttonSecondary:
    "bg-white hover:bg-gray-100 text-primary border border-primary",
  card: "rounded-lg shadow-md bg-white p-5 mb-6",
  input: "rounded-lg border border-gray-300 p-3 w-full",
  headingLarge: "text-2xl md:text-3xl font-bold",
  headingMedium: "text-xl font-bold",
}); 
  const styles = getCommonStyles();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setError('Username can only contain letters, numbers, underscores and hyphens');
      return;
    }

    try {
      await register(name, email, password, username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={`${styles.card} max-w-md w-full`}>
        <div className="mb-8 text-center">
          <h2 className={`${styles.headingLarge} text-gray-900`}>Create your account</h2>
          <p className="mt-2 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Your name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              placeholder="your_username"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be used for your blog URL: blogify.com/your_username
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`${styles.button} ${styles.buttonPrimary} w-full`}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register; 