const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const BlogCollection = require('../models/BlogCollection');

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search;

    let aggregationPipeline = [
      { $match: { isPublic: true } },
      { $unwind: "$articles" },
      { $sort: { "articles.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          collectionId: "$_id",
          collectionName: "$name",
          collectionSlug: "$slug",
          ownerUsername: 1,
          articleId: "$articles._id",
          title: "$articles.title",
          slug: "$articles.slug",
          content: "$articles.content",
          createdAt: "$articles.createdAt",
          updatedAt: "$articles.updatedAt",
          shareCount: "$articles.shareCount",
        },
      },
    ];

    if (searchQuery) {
      aggregationPipeline.unshift({
        $match: {
          $or: [
            { "articles.title": { $regex: searchQuery, $options: "i" } },
            { "articles.content": { $regex: searchQuery, $options: "i" } },
          ],
        },
      });
    }

    const articles = await BlogCollection.aggregate(aggregationPipeline);
    const total = await BlogCollection.aggregate([
      { $match: { isPublic: true } },
      { $unwind: "$articles" },
      { $count: "total" },
    ]);

    res.json({
      articles,
      currentPage: page,
      totalPages: Math.ceil((total.length > 0 ? total[0].total : 0) / limit),
      totalArticles: total.length > 0 ? total[0].total : 0,
    });
  } catch {
    res.status(500).json({ message: "Error fetching articles" });
  }
});

router.get("/:collectionId/:articleSlug", async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;
    const collection = await BlogCollection.findById(collectionId);
    if (!collection)
      return res.status(404).json({ message: "Collection not found" });

    const article = collection.articles.find((a) => a.slug === articleSlug);
    if (!article) return res.status(404).json({ message: "Article not found" });

    res.json({
      article,
      collectionName: collection.name,
      ownerUsername: collection.ownerUsername,
    });
  } catch {
    res.status(500).json({ message: "Error fetching article" });
  }
});

router.post("/:collectionId", auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const { collectionId } = req.params;

    if (
      !title ||
      !content ||
      title.length < 3 ||
      title.length > 100 ||
      content.length < 10
    ) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const blogCollection = await BlogCollection.findById(collectionId);
    if (
      !blogCollection ||
      blogCollection.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()
      .toString()
      .slice(-4)}`;
    const newArticle = {
      title,
      content,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    blogCollection.articles.push(newArticle);
    await blogCollection.save();

    res.status(201).json({
      article: newArticle,
      collectionName: blogCollection.name,
      collectionSlug: blogCollection.slug,
    });
  } catch {
    res.status(500).json({ message: "Error creating article" });
  }
});

router.patch("/:collectionId/:articleSlug", auth, async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;
    const { title, content } = req.body;

    const blogCollection = await BlogCollection.findById(collectionId);
    if (
      !blogCollection ||
      blogCollection.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const articleIndex = blogCollection.articles.findIndex(
      (a) => a.slug === articleSlug
    );
    if (articleIndex === -1)
      return res.status(404).json({ message: "Article not found" });

    const article = blogCollection.articles[articleIndex];
    if (title) {
      article.title = title;
      article.slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()
        .toString()
        .slice(-4)}`;
    }
    if (content) article.content = content;
    article.updatedAt = new Date();

    await blogCollection.save();
    res.json({ article, collectionName: blogCollection.name });
  } catch {
    res.status(500).json({ message: "Error updating article" });
  }
});

router.delete("/:collectionId/:articleSlug", auth, async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;
    const blogCollection = await BlogCollection.findById(collectionId);
    if (
      !blogCollection ||
      blogCollection.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const articleIndex = blogCollection.articles.findIndex(
      (a) => a.slug === articleSlug
    );
    if (articleIndex === -1)
      return res.status(404).json({ message: "Article not found" });

    blogCollection.articles.splice(articleIndex, 1);
    await blogCollection.save();
    res.json({ message: "Article deleted successfully" });
  } catch {
    res.status(500).json({ message: "Error deleting article" });
  }
});

router.post("/:collectionId/:articleSlug/share", async (req, res) => {
  try {
    const { collectionId, articleSlug } = req.params;
    const blogCollection = await BlogCollection.findById(collectionId);
    if (!blogCollection)
      return res.status(404).json({ message: "Blog collection not found" });

    await blogCollection.incrementArticleShare(articleSlug, req.body.platform);
    res.json({ message: "Share count updated successfully" });
  } catch {
    res.status(500).json({ message: "Error updating share count" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blogId = req.params.id;
    const blogCollections = await BlogCollection.find({
      "articles._id": blogId,
    }).limit(1);

    if (blogCollections.length > 0) {
      const collection = blogCollections[0];
      const article = collection.articles.find(
        (a) => a._id.toString() === blogId
      );
      if (article) {
        return res.status(301).json({ newUrl: `/${article.slug}` });
      }
    }

    return res
      .status(410)
      .json({ message: "This endpoint is no longer supported" });
  } catch {
    res.status(500).json({ message: "Server error processing legacy request" });
  }
});

module.exports = router; 