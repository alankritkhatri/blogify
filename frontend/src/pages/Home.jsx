import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postsError, setPostsError] = useState(null);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchBlogs();
    fetchLatestPosts();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blog-collections');
      console.log("Fetched blog collections:", response.data);
      setBlogs(response.data.collections || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await api.get('/blogs');
      console.log('Fetched latest posts:', response.data);
      setLatestPosts(response.data.articles || []);
      setPostsError(null);
    } catch (err) {
      console.error('Error fetching latest posts:', err);
      setPostsError('Failed to load latest posts. Please try again later.');
    } finally {
      setPostsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-primary py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="flex items-center justify-center gap-8 mb-6">
              <h1 className="text-4xl md:text-5xl font-bold">
                Create and share your own blog
              </h1>
            </div>
            <p className="text-xl mb-8">
              Easily publish your thoughts, stories, and ideas with our simple
              blogging platform.
            </p>
            {token ? (
              <Link
                to="/create-collection"
                className="bg-white text-primary hover:bg-gray-100 py-3 px-8 rounded-lg font-medium text-lg inline-block transition-colors"
              >
                Create Your Blog
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-white text-primary hover:bg-gray-100 py-3 px-8 rounded-lg font-medium text-lg inline-block transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Latest Posts Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Latest Posts</h2>
          <p className="text-gray-600">
            Discover the newest content from our community
          </p>
        </div>

        {postsError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded-lg">
            {postsError}
          </div>
        )}

        {postsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
              >
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.length > 0 ? (
              latestPosts.map((post) => (
                <Link
                  key={post.articleId}
                  to={`/blog/collection/${post.collectionId}/${post.slug}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.content.replace(/<[^>]*>?/gm, "").substring(0, 120)}
                      ...
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-gray-500">
                        By {post.ownerUsername}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-600">
                  No posts available yet. Be the first to create one!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blogs Section */}
      <div className="container mx-auto px-4 py-12 bg-gray-50">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Discover Blogs</h2>
          {user && (
            <Link
              to="/create-collection"
              className="bg-primary text-white py-2 px-5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Create Blog
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5 mb-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.length > 0 ? (
              blogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/${blog.subdomain}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xl font-bold">
                          {blog.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                      {blog.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {blog.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {blog.articles?.length || 0} article
                        {blog.articles?.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                        {blog.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-600 mb-6">
                  No blogs found. Be the first to create one!
                </p>
                {user && (
                  <Link
                    to="/create-collection"
                    className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Create New Blog
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;