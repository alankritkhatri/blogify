const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    
    // Input validation
    if (!email || !password || !name || !username) {
      return res.status(400).json({ 
        message: 'Registration failed', 
        error: 'All fields (email, password, name, username) are required' 
      });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Registration failed', 
        error: 'Invalid email format' 
      });
    }
    
    // Username format validation
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: 'Registration failed',
        error: 'Username can only contain letters, numbers, underscores and hyphens'
      });
    }
    
    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Registration failed', 
        error: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if user already exists with this email
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      console.log(`Registration failed: Email ${email} already exists`);
      return res.status(400).json({ 
        message: 'Registration failed', 
        error: 'User with this email already exists' 
      });
    }
    
    // Check if username is taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log(`Registration failed: Username ${username} already exists`);
      return res.status(400).json({ 
        message: 'Registration failed', 
        error: 'Username is already taken' 
      });
    }

    // Create new user
    const user = new User({ email, password, name, username });
    
    try {
      await user.save();
      console.log(`User registered successfully: ${email} (${username})`);

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username
        }
      });
    } catch (saveError) {
      if (saveError.code === 11000) {
        // Duplicate key error
        return res.status(400).json({
          message: 'Registration failed',
          error: 'User with this email or username already exists'
        });
      }
      throw saveError; // Pass to outer catch block
    }
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ 
      message: 'Error creating user', 
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Login failed', 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: No user found with email ${email}`);
      return res.status(401).json({ 
        message: 'Login failed', 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Incorrect password for ${email}`);
      return res.status(401).json({ 
        message: 'Login failed', 
        error: 'Invalid email or password' 
      });
    }

    console.log(`User logged in successfully: ${email}`);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ 
      message: 'Error logging in', 
      error: error.message 
    });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    // Extract token
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        error: 'Invalid or missing token' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found', 
        error: 'User associated with this token no longer exists' 
      });
    }
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router; 