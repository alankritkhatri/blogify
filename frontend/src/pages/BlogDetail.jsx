import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const BlogDetail = () => {
  const { id, username, slug, collectionId, articleSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        let response;

        // Check which URL pattern we're using and make the appropriate API call
        if (collectionId && articleSlug) {
          // New pattern with collection ID and article slug - this is our current standard
          try {
            response = await api.get(`/blogs/${collectionId}/${articleSlug}`);
            setBlog({
              ...response.data.article,
              _id: response.data.article._id || `${collectionId}-${response.data.article.slug}`,
              title: response.data.article.title,
              content: response.data.article.content,
              createdAt: response.data.article.createdAt,
              author: {
                name: response.data.ownerUsername,
                username: response.data.ownerUsername,
                _id: null // We don't have this in the new model
              },
              authorUsername: response.data.ownerUsername,
              collectionId: collectionId,
              collectionName: response.data.collectionName
            });
          } catch (err) {
            console.error('Error fetching blog with collection/slug:', err);
            setError('This article could not be found. It may have been moved or deleted.');
            setLoading(false);
            return;
          }
        } else if (id) {
          // Legacy ID-based URL - needs to be updated
          try {
            response = await api.get(`/blogs/${id}`);
            
            // Check if we got the special API change error
            if (response.data && response.data.code === 'API_STRUCTURE_CHANGED') {
              setError('This URL format is no longer supported. Articles are now accessed through collection IDs and article slugs.');
              setLoading(false);
              return;
            }
            
            // Check if we got redirect information
            if (response.data && response.data.code === 'REDIRECT_TO_NEW_FORMAT') {
              console.log('Found redirect information for this article', response.data);
              // Redirect to the new URL format
              navigate(`/blog/collection/${response.data.collectionId}/${response.data.articleSlug}`, { replace: true });
              return;
            }
            
            setBlog(response.data);
          } catch (err) {
            setError('This article could not be found. The URL format is outdated.');
            setLoading(false);
            return;
          }
        } else if (username && slug) {
          // Username/slug-based URL - legacy format
          try {
            response = await api.get(`/blogs/user/${username}/${slug}`);
            setBlog(response.data);
          } catch (err) {
            setError('This article could not be found. The URL format is outdated.');
            setLoading(false);
            return;
          }
        } else {
          throw new Error('Invalid URL pattern');
        }

        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to load article. Please try again later.');
        setLoading(false);
      }
    };

    fetchBlog();
    setShareUrl(window.location.href);
  }, [id, username, slug, collectionId, articleSlug, navigate]);

  const handleCopyLink = async () => {
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    
    // Record copy link share with API
    try {
      if (blog && collectionId && articleSlug) {
        await api.post(`/blogs/${collectionId}/${articleSlug}/share`, { platform: 'copyLink' });
      } else if (blog?._id) {
        // Legacy method - will no longer work with new model
        console.warn('Using deprecated share API. Please update to collection/slug pattern.');
      }
    } catch (err) {
      console.error('Failed to record share:', err);
    }
    
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareOnSocialMedia = async (platform) => {
    let shareLink;
    const text = encodeURIComponent(`Check out this blog post: ${blog?.title}`);
    const url = encodeURIComponent(shareUrl);
    
    switch(platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      default:
        return;
    }
    
    // Record share with API
    try {
      if (blog && collectionId && articleSlug) {
        await api.post(`/blogs/${collectionId}/${articleSlug}/share`, { platform });
      } else if (blog?._id) {
        // Legacy method - will no longer work with new model
        console.warn('Using deprecated share API. Please update to collection/slug pattern.');
      }
    } catch (err) {
      console.error('Failed to record share:', err);
    }
    
    window.open(shareLink, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">
          {error || 'Blog post not found'}
        </div>
        <div className="mt-4">
          <Link to="/" className="hs-btn hs-btn-secondary mr-4">
            Go to Home
          </Link>
          <Link to="/my-collections" className="hs-btn hs-btn-primary">
            My Blog Collections
          </Link>
        </div>
      </div>
    );
  }

  // Make sure we have an authorUsername, even if the blog data structure is inconsistent
  const authorUsername = blog.authorUsername || 
                         (blog.author && blog.author.username) || 
                         'Anonymous';
  
  // Use most reliable method to check if user is the author
  const isAuthor = user && (
    (blog.authorUsername && blog.authorUsername === user.username) ||
    (blog.author && blog.author._id === user.id) ||
    (blog.author && blog.author.username === user.username)
  );

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Blog header area with blue background */}
        <div className="bg-primary rounded-3xl mb-8 p-8 text-white">
          <h1 className="text-3xl font-bold mb-4 text-white">{blog.title}</h1>
          
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">{authorUsername.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <Link to={`/${authorUsername}`} className="font-medium hover:underline">
                {authorUsername}
              </Link>
              <p className="text-sm text-white/80">{new Date(blog.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Collection info if available */}
          {blog.collectionName && (
            <div className="mt-4 bg-white/10 rounded-lg px-4 py-2 inline-block">
              <Link to={`/collections/${blog.collectionId}`} className="text-white hover:underline">
                Collection: {blog.collectionName}
              </Link>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="hs-card">
          <div className="blog-content whitespace-pre-wrap mb-8">
            {blog.content}
          </div>
          
          {/* Share Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-4">Share this post</h3>
            <div className="flex space-x-3">
              <button 
                onClick={() => shareOnSocialMedia('twitter')} 
                className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-co  lors"
                aria-label="Share on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button 
                onClick={() => shareOnSocialMedia('facebook')} 
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                aria-label="Share on Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button 
                onClick={() => shareOnSocialMedia('linkedin')} 
                className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button 
                onClick={handleCopyLink} 
                className={`p-3 ${copySuccess ? 'bg-green-500' : 'bg-gray-600'} text-white rounded-full hover:bg-gray-700 transition-colors flex items-center`}
                aria-label="Copy link"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                {copySuccess && <span className="text-xs ml-1">Copied!</span>}
              </button>
            </div>
          </div>
          
          <div className="flex mt-8 space-x-4">
            <Link to="/" className="hs-btn hs-btn-secondary">
              Back to Home
            </Link>
            
            {isAuthor && blog.collectionId && blog.slug && (
              <Link to={`/blog/edit/${blog.collectionId}/${blog.slug}`} className="hs-btn hs-btn-primary">
                Edit Post
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail; 