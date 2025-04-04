const mongoose = require('mongoose');
const slugify = require('slugify');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  shareCount: {
    type: Number,
    default: 0
  },
  shares: {
    twitter: { type: Number, default: 0 },
    facebook: { type: Number, default: 0 },
    linkedin: { type: Number, default: 0 },
    copyLink: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const blogCollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  subdomain: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
    sparse: true
  },
  description: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerUsername: {
    type: String,
    required: true,
    ref: 'User'
  },
  articles: [articleSchema],
  isPublic: {
    type: Boolean,
    default: true
  },
  coverImage: {
    type: String
  }
}, {
  timestamps: true
}); 

blogCollectionSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    const baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
    });

    this.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  if (this.isModified("name") && !this.subdomain) {
    this.subdomain = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[^a-z0-9-]/g,
    });
  }

  if (this.isModified("articles")) {
    this.articles.forEach((article) => {
      if (!article.slug) {
        const baseSlug = slugify(article.title, {
          lower: true,
          strict: true,
        });
        article.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      if (article.isModified && article.isModified("content")) {
        article.updatedAt = Date.now();
      }
    });
  }

  next();
});

blogCollectionSchema.methods.incrementArticleShare = function(articleSlug, platform) {
  const article = this.articles.find(a => a.slug === articleSlug);
  if (article) {
    if (platform && article.shares[platform] !== undefined) {
      article.shares[platform] += 1;
    }
    article.shareCount += 1;
    return this.save();
  }
  return Promise.reject(new Error('Article not found'));
};

const BlogCollection = mongoose.model('BlogCollection', blogCollectionSchema);
module.exports = BlogCollection; 