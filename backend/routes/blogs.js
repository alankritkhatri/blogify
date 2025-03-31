const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const BlogCollection = require('../models/BlogCollection');

// Get all articles across collections with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search;

    // Aggregation to get articles from all collections
    let aggregationPipeline = [
      { $match: { isPublic: true } },
      { $unwind: '$articles' },
      { $sort: { 'articles.createdAt': -1 } }
    ];

    // Add search filter if provided
    if (searchQuery) {
      aggregationPipeline.unshift({
        $match: {
          $or: [
            { 'articles.title': { $regex: searchQuery, $options: 'i' } },
            { 'articles.content': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      });
    }

    // Add pagination
    const countPipeline = [...aggregationPipeline];
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });

    // Project only necessary fields
    aggregationPipeline.push({
      $project: {
        _id: 0,
        collectionId: '$_id',
        collectionName: '$name',
        collectionSlug: '$slug',
        ownerUsername: 1,
        articleId: '$articles._id',
        title: '$articles.title',
        slug: '$articles.slug',
        content: '$articles.content',
        createdAt: '$articles.createdAt',
        updatedAt: '$articles.updatedAt',
        shareCount: '$articles.shareCount'
      }
    });

    const articles = await BlogCollection.aggregate(aggregationPipeline);
    
    // Count total articles for pagination
    const countResult = await BlogCollection.aggregate([
      ...countPipeline,
      { $count: 'total' }
    ]);
    
    const total = countResult.length > 0 ? countResult[0].total : 0;

    console.log(`Retrieved ${articles.length} articles (page ${page}, limit ${limit})`);
    
    res.json({
      articles,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalArticles: total
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ 
      message: 'Error fetching articles', 
      error: error.message 
    });
  }
});

// Get single article by collection ID and article slug
router.get('/:collectionId/:articleSlug', async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;

    const collection = await BlogCollection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ 
        message: 'Collection not found', 
        error: 'The requested blog collection does not exist' 
      });
    }

    const article = collection.articles.find(a => a.slug === articleSlug);
    if (!article) {
      return res.status(404).json({ 
        message: 'Article not found', 
        error: 'The requested article does not exist' 
      });
    }

    console.log(`Retrieved article: ${article.title}`);
    res.json({
      article,
      collectionName: collection.name,
      ownerUsername: collection.ownerUsername
    });
  } catch (error) {
    console.error(`Error fetching article:`, error);
    res.status(500).json({ 
      message: 'Error fetching article', 
      error: error.message 
    });
  }
});

// Create new article in a collection (protected route)
router.post('/:collectionId', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const { collectionId } = req.params;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        error: 'Title and content are required' 
      });
    }
    
    // Validate title length
    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({ 
        message: 'Invalid title length', 
        error: 'Title must be between 3 and 100 characters' 
      });
    }
    
    // Validate content length
    if (content.length < 10) {
      return res.status(400).json({ 
        message: 'Content too short', 
        error: 'Content must be at least 10 characters long' 
      });
    }

    // Find the blog collection and verify ownership
    const blogCollection = await BlogCollection.findById(collectionId);
    if (!blogCollection) {
      return res.status(404).json({
        message: 'Blog collection not found',
        error: 'The specified blog collection does not exist'
      });
    }

    if (blogCollection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized',
        error: 'You can only create articles in your own blog collections'
      });
    }

    // Create slug from title
    const slugify = require('slugify');
    const baseSlug = slugify(title, {
      lower: true,
      strict: true
    });
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    // Create new article and add to collection
    const newArticle = {
      title,
      content,
      slug,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    blogCollection.articles.push(newArticle);
    await blogCollection.save();
    
    // Get the newly added article
    const article = blogCollection.articles[blogCollection.articles.length - 1];
    
    console.log(`New article created: ${title} in blog collection: ${blogCollection.name}`);
    
    res.status(201).json({
      article,
      collectionName: blogCollection.name,
      collectionSlug: blogCollection.slug,
      subdomain: blogCollection.subdomain
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ 
      message: 'Error creating article', 
      error: error.message 
    });
  }
});

// Update an article (protected route)
router.patch('/:collectionId/:articleSlug', auth, async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;
    const { title, content } = req.body;
    
    // Validate inputs if provided
    if (title !== undefined && (title.length < 3 || title.length > 100)) {
      return res.status(400).json({ 
        message: 'Invalid title length', 
        error: 'Title must be between 3 and 100 characters' 
      });
    }
    
    if (content !== undefined && content.length < 10) {
      return res.status(400).json({ 
        message: 'Content too short', 
        error: 'Content must be at least 10 characters long' 
      });
    }

    // Find the blog collection and verify ownership
    const blogCollection = await BlogCollection.findById(collectionId);
    if (!blogCollection) {
      return res.status(404).json({
        message: 'Blog collection not found',
        error: 'The specified blog collection does not exist'
      });
    }

    if (blogCollection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized',
        error: 'You can only update articles in your own blog collections'
      });
    }

    // Find the article in the collection
    const articleIndex = blogCollection.articles.findIndex(a => a.slug === articleSlug);
    if (articleIndex === -1) {
      return res.status(404).json({
        message: 'Article not found',
        error: 'The specified article does not exist in this collection'
      });
    }

    // Only update allowed fields
    const article = blogCollection.articles[articleIndex];
    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    article.updatedAt = new Date();

    // Generate new slug if title changed
    if (title !== undefined) {
      const slugify = require('slugify');
      const baseSlug = slugify(title, {
        lower: true,
        strict: true
      });
      article.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    await blogCollection.save();
    
    console.log(`Article updated: ${article.title}`);
    res.json({
      article,
      collectionName: blogCollection.name
    });
  } catch (error) {
    console.error(`Error updating article:`, error);
    res.status(500).json({ 
      message: 'Error updating article', 
      error: error.message 
    });
  }
});

// Delete an article (protected route)
router.delete('/:collectionId/:articleSlug', auth, async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;

    // Find the blog collection and verify ownership
    const blogCollection = await BlogCollection.findById(collectionId);
    if (!blogCollection) {
      return res.status(404).json({
        message: 'Blog collection not found',
        error: 'The specified blog collection does not exist'
      });
    }

    if (blogCollection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized',
        error: 'You can only delete articles in your own blog collections'
      });
    }

    // Find the article in the collection
    const articleIndex = blogCollection.articles.findIndex(a => a.slug === articleSlug);
    if (articleIndex === -1) {
      return res.status(404).json({
        message: 'Article not found',
        error: 'The specified article does not exist in this collection'
      });
    }

    // Remove the article from the collection
    const deletedArticle = blogCollection.articles[articleIndex];
    blogCollection.articles.splice(articleIndex, 1);
    await blogCollection.save();
    
    console.log(`Article deleted: ${deletedArticle.title}`);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(`Error deleting article:`, error);
    res.status(500).json({ 
      message: 'Error deleting article', 
      error: error.message 
    });
  }
});

// Increment share count for an article
router.post('/:collectionId/:articleSlug/share', async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;
    const { platform } = req.body;

    const blogCollection = await BlogCollection.findById(collectionId);
    if (!blogCollection) {
      return res.status(404).json({
        message: 'Blog collection not found',
        error: 'The specified blog collection does not exist'
      });
    }

    try {
      await blogCollection.incrementArticleShare(articleSlug, platform);
      res.json({ message: 'Share count updated successfully' });
    } catch (error) {
      res.status(404).json({
        message: 'Article not found',
        error: error.message
      });
    }
  } catch (error) {
    console.error(`Error updating share count:`, error);
    res.status(500).json({ 
      message: 'Error updating share count', 
      error: error.message 
    });
  }
});

// Legacy route handler - this should be placed AFTER all your collection-based routes
// to ensure that the new routes have a chance to match first
router.get('/:id', async (req, res) => {
  try {
    const blogId = req.params.id;
    
    // Log legacy route access attempt
    console.log(`[LEGACY ACCESS] Blog ID route accessed: ${blogId}`);
    
    // Try to find an article in any collection that might match the legacy ID
    // This is a best-effort to help migrate users from old URLs
    const blogCollections = await BlogCollection.find({ 
      "articles._id": blogId
    }).limit(1);
    
    // If we found a matching collection/article
    if (blogCollections && blogCollections.length > 0) {
      const collection = blogCollections[0];
      const article = collection.articles.find(a => a._id.toString() === blogId);
      
      if (article) {
        // Return information that can help redirect to the new URL
        return res.status(301).json({
          code: 'REDIRECT_TO_NEW_FORMAT',
          message: 'This article is now available at a new URL',
          newUrl: `/blogs/${collection._id}/${article.slug}`,
          collectionId: collection._id,
          articleSlug: article.slug,
          collectionName: collection.name
        });
      }
    }
    
    // No matching article found, return general info
    return res.status(410).json({
      code: 'API_STRUCTURE_CHANGED',
      error: `This endpoint is no longer supported. Blogs are now accessed via collection ID and article slug: /api/blogs/:collectionId/:articleSlug`,
      message: `The blog ID format ${blogId} you're using is deprecated`,
      legacyId: blogId
    });
  } catch (error) {
    console.error(`Error handling legacy blog route for ID ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Server error processing legacy request' });
  }
});

module.exports = router; 