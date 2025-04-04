const express = require('express');
const BlogCollection = require('../models/BlogCollection');
const User = require('../models/User');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const collections = await BlogCollection.find({ isPublic: true })
      .select(
        "name description slug subdomain owner ownerUsername isPublic coverImage createdAt articles"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogCollection.countDocuments({ isPublic: true });

    const processedCollections = collections.map((collection) => {
      return {
        ...collection.toObject(),
        articleCount: collection.articles.length,
        articles: collection.articles
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 3)
          .map((article) => ({
            title: article.title,
            slug: article.slug,
            createdAt: article.createdAt,
          })),
      };
    });

    res.json({
      collections: processedCollections,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCollections: total,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching blog collections",
        error: error.message,
      });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { name, description, isPublic, coverImage, subdomain } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({ message: "Invalid name length" });
    }

    if (description.length < 10 || description.length > 500) {
      return res.status(400).json({ message: "Invalid description length" });
    }

    if (subdomain) {
      if (
        !/^[a-z0-9-]+$/.test(subdomain) ||
        subdomain.length < 3 ||
        subdomain.length > 30
      ) {
        return res.status(400).json({ message: "Invalid subdomain" });
      }

      const existingCollection = await BlogCollection.findOne({ subdomain });
      if (existingCollection) {
        return res.status(409).json({ message: "Subdomain already taken" });
      }
    }

    if (!req.user || !req.user._id || !req.user.username) {
      return res.status(401).json({ message: "Authentication error" });
    }

    const collection = new BlogCollection({
      name,
      description,
      owner: req.user._id,
      ownerUsername: req.user.username,
      isPublic: isPublic !== undefined ? isPublic : true,
      coverImage: coverImage || null,
      subdomain: subdomain || undefined,
    });

    await collection.save();
    await User.findByIdAndUpdate(req.user._id, {
      $push: { blogCollections: collection._id },
    });

    res.status(201).json(collection);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error creating blog collection",
        error: error.message,
      });
  }
});

router.get("/my-collections", auth, async (req, res) => {
  try {
    const collections = await BlogCollection.find({ owner: req.user._id }).sort(
      { createdAt: -1 }
    );
    const processedCollections = collections.map((collection) => ({
      ...collection.toObject(),
      articleCount: collection.articles.length,
    }));

    res.json(processedCollections);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching blog collections",
        error: error.message,
      });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description, isPublic, coverImage } = req.body;
    const collection = await BlogCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Blog collection not found" });
    }

    if (collection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

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
    res.json(updatedCollection);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error updating blog collection",
        error: error.message,
      });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const collection = await BlogCollection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: "Blog collection not found" });
    }

    if (!collection.isPublic) {
      if (!req.header("Authorization")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = req.header("Authorization").replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || collection.owner.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    collection.articles.sort((a, b) => b.createdAt - a.createdAt);
    res.json(collection);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching blog collection",
        error: error.message,
      });
  }
});

router.get("/by-subdomain/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;
    const collection = await BlogCollection.findOne({
      subdomain: subdomain.toLowerCase(),
    });

    if (!collection) {
      return res.status(404).json({ message: "Blog collection not found" });
    }

    if (!collection.isPublic) {
      if (!req.header("Authorization")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = req.header("Authorization").replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || collection.owner.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    collection.articles.sort((a, b) => b.createdAt - a.createdAt);
    res.json(collection);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching blog collection",
        error: error.message,
      });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const collection = await BlogCollection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: "Blog collection not found" });
    }

    if (collection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await BlogCollection.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blogCollections: req.params.id },
    });

    res.json({ message: "Blog collection deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error deleting blog collection",
        error: error.message,
      });
  }
});

module.exports = router; 