import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const CreateBlog = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const location = useLocation();
  const blogCollectionId = location.state?.blogCollectionId;
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(blogCollectionId || '');
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCollections();
    }
  }, [isAuthenticated]);

  const fetchUserCollections = async () => {
    try {
      setIsLoadingCollections(true);
      const response = await api.get("/blog-collections/my-collections");
      setCollections(response.data);

      if (!selectedCollectionId && response.data.length > 0) {
        setSelectedCollectionId(response.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch blog collections:", err);
      setError("Failed to load your blog collections. Please try again later.");
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    if (!isAuthenticated) {
      setError("You must be logged in to create a blog post");
      return;
    }

    const collectionId = selectedCollectionId || blogCollectionId;
    if (!collectionId) {
      setError("Please select a blog to add this article to");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setDebugInfo(null);

      const response = await api.post(`/blogs/${collectionId}`, {
        title,
        content,
      });

      if (response.data.article && response.data.article.slug) {
        navigate(
          `/blog/collection/${collectionId}/${response.data.article.slug}`
        );
      } else {
        navigate(`/collections/${collectionId}`);
      }
    } catch (err) {
      console.error("Failed to create article:", err);
      setError(err.response?.data?.message || "Failed to create article");
      setDebugInfo(`
        Error: ${err.message}
        Status: ${err.response?.status}
        Data: ${JSON.stringify(err.response?.data || {})}
      `);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="hs-heading-lg mb-3">Create New Blog Post</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Share your thoughts, ideas, and stories with the world. Great blogs
            are authentic, valuable, and engaging.
          </p>
        </div>

        {!isAuthenticated && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl mb-6 max-w-3xl mx-auto">
            <p className="font-bold">Authentication Warning</p>
            <p>
              You are not currently authenticated. Please log in to create a
              blog post.
            </p>
          </div>
        )}

        <div className="hs-card max-w-3xl mx-auto">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">
              <p className="font-bold">Error</p>
              <p>{error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">
                    Debug Info
                  </summary>
                  <pre className="text-xs bg-red-50 p-2 mt-2 rounded overflow-auto">
                    {debugInfo}
                  </pre>
                </details>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="blogCollection"
                className="block text-gray-700 font-medium mb-2"
              >
                Select Blog
              </label>
              {collections.length > 0 ? (
                <select
                  id="blogCollection"
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="hs-input"
                  required
                >
                  <option value="">-- Select a blog --</option>
                  {collections.map((collection) => (
                    <option key={collection._id} value={collection._id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              ) : isLoadingCollections ? (
                <div className="p-2">Loading your blogs...</div>
              ) : (
                <div className="p-2 border rounded bg-yellow-50 text-yellow-800">
                  You don't have any blogs yet.{" "}
                  <Link to="/create-collection" className="underline">
                    Create a blog
                  </Link>{" "}
                  first to add articles.
                </div>
              )}
            </div>

            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-gray-700 font-medium mb-2"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="hs-input"
                placeholder="Enter an engaging title"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="content"
                className="block text-gray-700 font-medium mb-2"
              >
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="hs-input min-h-[300px]"
                placeholder="Write your blog content here..."
                required
              />
            </div>

            <div className="flex space-x-4">
              <Link to="/" className="hs-btn hs-btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !isAuthenticated}
                className="hs-btn hs-btn-primary"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Publishing...
                  </span>
                ) : (
                  "Publish Post"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 bg-gray-50 rounded-3xl p-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-4">
            Tips for writing great blogs
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Start with a compelling title that grabs attention</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Break your content into paragraphs for easier reading</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Use simple language and avoid jargon</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Add relevant examples to illustrate your points</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog; 