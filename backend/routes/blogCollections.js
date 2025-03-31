const express = require('express');
const BlogCollection = require('../models/BlogCollection');
const User = require('../models/User');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Get all public blog collections
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Only fetch public collections by default
    const collections = await BlogCollection.find({ isPublic: true })
      .select('name description slug subdomain owner ownerUsername isPublic coverImage createdAt articles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await BlogCollection.countDocuments({ isPublic: true });
    
    // For each collection, add an articleCount field and limit articles to most recent 3
    const processedCollections = collections.map(collection => {
      const collectionObj = collection.toObject();
      collectionObj.articleCount = collection.articles.length;
      collectionObj.articles = collection.articles
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3)
        .map(article => ({
          title: article.title,
          slug: article.slug,
          createdAt: article.createdAt
        }));
      return collectionObj;
    });
    
    console.log(`Retrieved ${collections.length} public blog collections`);
    res.json({
      collections: processedCollections,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCollections: total
    });
  } catch (error) {
    console.error('Error fetching blog collections:', error);
    res.status(500).json({ 
      message: 'Error fetching blog collections', 
      error: error.message 
    });
  }
});

// Create new blog collection (protected route)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPublic, coverImage, subdomain } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        error: 'Name and description are required' 
      });
    }
    
    // Validate name length
    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({ 
        message: 'Invalid name length', 
        error: 'Name must be between 3 and 50 characters' 
      });
    }
    
    // Validate description length
    if (description.length < 10 || description.length > 500) {
      return res.status(400).json({ 
        message: 'Invalid description length', 
        error: 'Description must be between 10 and 500 characters' 
      });
    }

    // Validate subdomain if provided
    if (subdomain) {
      if (!/^[a-z0-9-]+$/.test(subdomain)) {
        return res.status(400).json({
          message: 'Invalid subdomain format',
          error: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
        });
      }
      
      if (subdomain.length < 3 || subdomain.length > 30) {
        return res.status(400).json({
          message: 'Invalid subdomain length',
          error: 'Subdomain must be between 3 and 30 characters'
        });
      }
      
      // Check if subdomain is already taken
      const existingCollection = await BlogCollection.findOne({ subdomain });
      if (existingCollection) {
        return res.status(409).json({
          message: 'Subdomain already taken',
          error: 'This subdomain is already in use. Please choose another one.'
        });
      }
    }

    // Validate that the user object contains all required fields
    if (!req.user || !req.user._id) {
      console.error('Error creating blog collection: User object missing or incomplete', req.user);
      return res.status(401).json({
        message: 'Authentication error',
        error: 'User data is missing or incomplete'
      });
    }

    if (!req.user.username) {
      console.error('Error creating blog collection: Username is missing in the user object', req.user);
      return res.status(401).json({
        message: 'User data incomplete',
        error: 'Username is missing in your user profile'
      });
    }

    // Create the blog collection with validated user data
    const collection = new BlogCollection({
      name,
      description,
      owner: req.user._id,
      ownerUsername: req.user.username,
      isPublic: isPublic !== undefined ? isPublic : true,
      coverImage: coverImage || null,
      subdomain: subdomain || undefined
    });
    
    try {
      await collection.save();
      
      // Add reference to the user's blog collections
      await User.findByIdAndUpdate(
        req.user._id, 
        { $push: { blogCollections: collection._id } }
      );
      
      console.log(`New blog collection created: ${collection.name} by ${req.user.name || req.user.username}`);
      res.status(201).json(collection);
    } catch (saveError) {
      console.error('Blog collection save error:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Blog collection validation failed',
          error: saveError.message
        });
      }
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.subdomain) {
        return res.status(409).json({
          message: 'Subdomain already taken',
          error: 'This subdomain is already in use. Please choose another one.'
        });
      }
      throw saveError; // Pass to outer catch block
    }
  } catch (error) {
    console.error('Error creating blog collection:', error);
    res.status(500).json({ 
      message: 'Error creating blog collection', 
      error: error.message 
    });
  }
});

// Get all blog collections for the logged-in user (protected route)
router.get('/my-collections', auth, async (req, res) => {
  try {
    const collections = await BlogCollection.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    
    // For each collection, add an articleCount field
    const processedCollections = collections.map(collection => {
      const collectionObj = collection.toObject();
      collectionObj.articleCount = collection.articles.length;
      return collectionObj;
    });
    
    console.log(`Retrieved ${collections.length} blog collections for user ${req.user.name}`);
    res.json(processedCollections);
  } catch (error) {
    console.error('Error fetching user blog collections:', error);
    res.status(500).json({ 
      message: 'Error fetching blog collections', 
      error: error.message 
    });
  }
});

// Update a blog collection (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, isPublic, coverImage } = req.body;
    
    // Find the blog collection
    const collection = await BlogCollection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ 
        message: 'Blog collection not found', 
        error: 'The requested blog collection does not exist' 
      });
    }
    
    // Check if the user is the owner
    if (collection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized', 
        error: 'You can only update your own blog collections' 
      });
    }
    
    // Validate name length
    if (name && (name.length < 3 || name.length > 50)) {
      return res.status(400).json({ 
        message: 'Invalid name length', 
        error: 'Name must be between 3 and 50 characters' 
      });
    }
    
    // Validate description length
    if (description && (description.length < 10 || description.length > 500)) {
      return res.status(400).json({ 
        message: 'Invalid description length', 
        error: 'Description must be between 10 and 500 characters' 
      });
    }
    
    // Update the collection
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (coverImage !== undefined) updates.coverImage = coverImage || null;
    
    const updatedCollection = await BlogCollection.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    console.log(`Blog collection updated: ${updatedCollection.name} by ${req.user.name}`);
    res.json(updatedCollection);
  } catch (error) {
    console.error(`Error updating blog collection with ID ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error updating blog collection', 
      error: error.message 
    });
  }
});

// Get a specific blog collection by ID
router.get('/:id', async (req, res) => {
  try {
    const collection = await BlogCollection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ 
        message: 'Blog collection not found', 
        error: 'The requested blog collection does not exist' 
      });
    }
    
    // Check if the collection is private and if the requester is not the owner
    if (!collection.isPublic) {
      // Authentication needed for private collections
      if (!req.header('Authorization')) {
        return res.status(401).json({ 
          message: 'Authentication required', 
          error: 'This is a private blog collection' 
        });
      }
      
      try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        
        if (!user || collection.owner.toString() !== user._id.toString()) {
          return res.status(403).json({ 
            message: 'Not authorized', 
            error: 'You do not have permission to view this private blog collection' 
          });
        }
      } catch (error) {
        return res.status(401).json({ 
          message: 'Authentication failed', 
          error: 'Invalid authentication token' 
        });
      }
    }
    
    // Sort articles by creation date (newest first)
    collection.articles.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log(`Retrieved blog collection: ${collection.name}`);
    res.json(collection);
  } catch (error) {
    console.error(`Error fetching blog collection with ID ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error fetching blog collection', 
      error: error.message 
    });
  }
});

// Get a specific blog collection by subdomain
router.get('/by-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const collection = await BlogCollection.findOne({ 
      subdomain: subdomain.toLowerCase()
    });
    
    if (!collection) {
      return res.status(404).json({ 
        message: 'Blog collection not found', 
        error: 'The requested blog collection does not exist' 
      });
    }
    
    // Check if the collection is private and if the requester is not the owner
    if (!collection.isPublic) {
      // Authentication needed for private collections
      if (!req.header('Authorization')) {
        return res.status(401).json({ 
          message: 'Authentication required', 
          error: 'This is a private blog collection' 
        });
      }
      
      try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        
        if (!user || collection.owner.toString() !== user._id.toString()) {
          return res.status(403).json({ 
            message: 'Not authorized', 
            error: 'You do not have permission to view this private blog collection' 
          });
        }
      } catch (error) {
        return res.status(401).json({ 
          message: 'Authentication failed', 
          error: 'Invalid authentication token' 
        });
      }
    }
    
    // Sort articles by creation date (newest first)
    collection.articles.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log(`Retrieved blog collection by subdomain: ${collection.name}`);
    res.json(collection);
  } catch (error) {
    console.error(`Error fetching blog collection with subdomain ${req.params.subdomain}:`, error);
    res.status(500).json({ 
      message: 'Error fetching blog collection', 
      error: error.message 
    });
  }
});

// Delete a blog collection (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find the blog collection
    const collection = await BlogCollection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ 
        message: 'Blog collection not found', 
        error: 'The requested blog collection does not exist' 
      });
    }
    
    // Check if the user is the owner
    if (collection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized', 
        error: 'You can only delete your own blog collections' 
      });
    }
    
    // Delete the collection
    await BlogCollection.findByIdAndDelete(req.params.id);
    
    // Remove reference from the user's blog collections
    await User.findByIdAndUpdate(
      req.user._id, 
      { $pull: { blogCollections: req.params.id } }
    );
    
    console.log(`Blog collection deleted: ${collection.name}`);
    res.json({ message: 'Blog collection deleted successfully' });
  } catch (error) {
    console.error(`Error deleting blog collection with ID ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error deleting blog collection', 
      error: error.message 
    });
  }
});

module.exports = router; 