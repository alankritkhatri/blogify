const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('Auth failed: No Authorization header');
      return res.status(401).json({ 
        message: 'Please authenticate',
        error: 'No Authorization header provided'
      });
    }
    
    // Check for Bearer prefix
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Auth failed: Invalid Authorization format');
      return res.status(401).json({ 
        message: 'Please authenticate',
        error: 'Invalid Authorization format - must start with "Bearer "'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth failed: Empty token');
      return res.status(401).json({ 
        message: 'Please authenticate',
        error: 'Empty token provided'
      });
    }
    
    // For debugging
    console.log('Token received:', token.substring(0, 15) + '...');
    
    try {
      const secret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      console.log('Token successfully decoded:', JSON.stringify(decoded));
      
      // Check what fields we're using to find the user
      console.log('Looking for user with ID:', decoded.userId);
      console.log('JWT decoded fields:', Object.keys(decoded));
      
      // Use a projection to ensure we get all required fields
      const user = await User.findOne(
        { _id: decoded.userId },
        { _id: 1, email: 1, name: 1, username: 1 }
      );
      
      if (!user) {
        console.log('Auth failed: User not found for decoded token');
        return res.status(401).json({
          message: 'Please authenticate',
          error: 'User not found for this token'
        });
      }
      
      // Verify the username exists
      if (!user.username) {
        console.log('Auth failed: User has no username:', user);
        return res.status(401).json({
          message: 'Authentication error',
          error: 'User account is incomplete (missing username)'
        });
      }
      
      // Set user and token in request for route handlers
      req.user = user;
      req.token = token;
      
      console.log('Authentication successful for user:', user._id.toString());
      console.log('User object:', JSON.stringify(user, null, 2));
      next();
    } catch (jwtError) {
      console.log('Token verification failed:', jwtError.message);
      return res.status(401).json({
        message: 'Please authenticate',
        error: `Token verification failed: ${jwtError.message}`
      });
    }
  } catch (error) {
    console.error('Unexpected error in auth middleware:', error);
    res.status(500).json({ 
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = auth; 