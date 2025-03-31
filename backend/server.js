const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://blogify-rose-five.vercel.app",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
  const { method, url } = req;
  
  if (method !== 'GET') {
    console.log(`${method} ${url}`);
  }
  
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/blog-collections', require('./routes/blogCollections'));

app.get('/api/test-auth', (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'No Authorization header found' 
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'Invalid Authorization format' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    res.json({ 
      message: 'Authentication header detected', 
      tokenReceived: true 
    });
  } catch (error) {
    console.error('Error in test auth route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/blogify')
.then(() => {
  console.log('Connected to MongoDB');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 