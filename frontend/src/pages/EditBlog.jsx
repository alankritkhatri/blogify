import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const EditBlog = () => {
  const { id, collectionId, articleSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [blogData, setBlogData] = useState(null);
  
  const getCommonStyles = () => ({
    button: "rounded-lg py-2 px-5 text-base font-medium transition-colors",
    buttonPrimary: "bg-primary hover:bg-primary-dark text-white",
    buttonSecondary:
      "bg-white hover:bg-gray-100 text-primary border border-primary",
    card: "rounded-lg shadow-md bg-white p-5 mb-6",
    input: "rounded-lg border border-gray-300 p-3 w-full",
    headingLarge: "text-2xl md:text-3xl font-bold",
    headingMedium: "text-xl font-bold",
  }); 
  const styles = getCommonStyles();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        let response;
        
        if (collectionId && articleSlug) {
          response = await api.get(`/blogs/${collectionId}/${articleSlug}`);
          if (response.data && response.data.article) {
            setTitle(response.data.article.title);
            setContent(response.data.article.content);
            setBlogData({
              collectionId,
              articleSlug,
              ...response.data.article,
              ownerUsername: response.data.ownerUsername,
              collectionName: response.data.collectionName,
            });
          }
        } else if (id) {
          try {
            console.warn(
              "Using deprecated route structure. Please update to collection/article pattern."
            );
            response = await api.get(`/blogs/${id}`);
            if (response.data) {
              setTitle(response.data.title);
              setContent(response.data.content);
              setBlogData(response.data);
            }
          } catch (err) {

            setError(
              "This blog post URL is outdated. Please use the new URL format."
            );
          }
        } else {
          throw new Error("Invalid URL parameters");
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load blog post for editing:', err);
        setError('Failed to load blog post for editing');
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, collectionId, articleSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (collectionId && articleSlug) {
        await api.patch(`/blogs/${collectionId}/${articleSlug}`, {
          title,
          content,
        });

        navigate(`/blog/collection/${collectionId}/${articleSlug}`);
      } else if (id && blogData) {
        console.warn(
          "Using deprecated API endpoints. Please update to collection/article pattern."
        );
        try {
          await api.patch(`/blogs/${id}`, {
            title,
            content,
          });
          navigate(`/blog/${id}`);
        } catch (err) {
          console.error(
            "This route is no longer supported with the new data model",
            err
          );
          setError(
            "This blog post update failed due to model changes. Please use the new URL format."
          );
          setSubmitting(false);
        }
      } else {
        throw new Error("Invalid blog data");
      }
    } catch (err) {
      console.error("Failed to update blog post:", err);
      setError(
        "Failed to update blog post: " +
          (err.response?.data?.error || err.message)
      );
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!loading && blogData) {
      if (
        collectionId &&
        articleSlug &&
        blogData.ownerUsername !== user?.username
      ) {
        setError("You are not authorized to edit this blog post");
        setTimeout(() => navigate("/"), 3000);
      } else if (id && blogData.author && blogData.author._id !== user?.id) {
        setError("You are not authorized to edit this blog post");
        setTimeout(() => navigate("/"), 3000);
      }
    }
  }, [loading, blogData, user, navigate, id, collectionId, articleSlug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  } 

  return (
    <div className="bg-background-light min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className={styles.card}>
          <h1 className={`${styles.headingLarge} mb-6`}>Edit Blog Post</h1>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                placeholder="Enter blog title"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`${styles.input} min-h-[300px]`}
                placeholder="Write your blog content here..."
                required
              />
            </div>
            
            <div className="flex space-x-4">
              <Link 
                to={collectionId && articleSlug 
                  ? `/blog/collection/${collectionId}/${articleSlug}` 
                  : `/blog/${id}`} 
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBlog; 