const express = require('express');
const BlogCollection = require('../models/BlogCollection');
const User = require('../models/User');
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res) => {
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
  res.json({
    collections,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalCollections: total,
  });
});

router.post("/", auth, async (req, res) => {
  const { name, description, isPublic, coverImage, subdomain } = req.body;
  const collection = new BlogCollection({
    name,
    description,
    owner: req.user._id,
    isPublic,
    coverImage,
    subdomain,
  });
  await collection.save();
  res.status(201).json(collection);
});

router.get("/my-collections", auth, async (req, res) => {
  const collections = await BlogCollection.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(collections);
});

router.get("/:id", async (req, res) => {
  const collection = await BlogCollection.findById(req.params.id);
  if (!collection) return res.status(404).json({ message: "Not found" });
  res.json(collection);
});

router.delete("/:id", auth, async (req, res) => {
  await BlogCollection.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router; 