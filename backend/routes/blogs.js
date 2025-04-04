const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const BlogCollection = require('../models/BlogCollection');

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const articles = await BlogCollection.aggregate([
    { $match: { isPublic: true } },
    { $unwind: "$articles" },
    { $sort: { "articles.createdAt": -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        collectionId: "$_id",
        title: "$articles.title",
        slug: "$articles.slug",
        content: "$articles.content",
      },
    },
  ]);

  const total = await BlogCollection.aggregate([
    { $match: { isPublic: true } },
    { $unwind: "$articles" },
    { $count: "total" },
  ]);
  res.json({
    articles,
    currentPage: page,
    totalPages: Math.ceil(total[0]?.total / limit),
    totalArticles: total[0]?.total,
  });
});

router.get("/:collectionId/:articleSlug", async (req, res) => {
  const collection = await BlogCollection.findById(req.params.collectionId);
  const article = collection.articles.find(
    (a) => a.slug === req.params.articleSlug
  );
  res.json({ article });
});

router.post("/:collectionId", auth, async (req, res) => {
  const { title, content } = req.body;
  const slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  const newArticle = {
    title,
    content,
    slug,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const blogCollection = await BlogCollection.findById(req.params.collectionId);
  blogCollection.articles.push(newArticle);
  await blogCollection.save();
  res.status(201).json(newArticle);
});

router.delete("/:collectionId/:articleSlug", auth, async (req, res) => {
  const blogCollection = await BlogCollection.findById(req.params.collectionId);
  const articleIndex = blogCollection.articles.findIndex(
    (a) => a.slug === req.params.articleSlug
  );
  blogCollection.articles.splice(articleIndex, 1);
  await blogCollection.save();
  res.json({ message: "Deleted" });
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