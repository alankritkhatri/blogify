import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

function SubdomainArticle() {
  const [articleData, setArticleData] = useState(null);
  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subdomain, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (subdomain && slug) {
      fetchArticle();
    }
  }, [subdomain, slug]);

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      // First, find the collection with this subdomain
      const collectionResponse = await api.get(`/blog-collections/by-subdomain/${subdomain}`);
      
      if (!collectionResponse.data) {
        throw new Error('Blog collection not found');
      }
      
      const blogCollection = collectionResponse.data;
      setCollection(blogCollection);
      
      // Find the article with the matching slug in the collection's articles array
      const article = blogCollection.articles.find(a => a.slug === slug);
      
      if (!article) {
        throw new Error('Article not found');
      }
      
      console.log('Article found:', article);
      setArticleData({
        ...article,
        collectionId: blogCollection._id
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching article:', err);
      if (err.response?.status === 404 || err.message === 'Article not found' || err.message === 'Blog collection not found') {
        setError('This article does not exist or has been removed.');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError('This blog is private. You need to be logged in to view it.');
      } else {
        setError('Failed to load the article. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = user && collection?.ownerUsername === user.username;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
          <div className="flex justify-center mt-6">
            <Link 
              to={`/${subdomain}`}
              className="text-primary hover:text-primary-dark mr-4"
            >
              Return to blog
            </Link>
            <Link 
              to="/"
              className="text-primary hover:text-primary-dark"
            >
              Return to home page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!articleData || !collection) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            to={`/${subdomain}`}
            className="text-primary hover:text-primary-dark flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to {collection.name}
          </Link>
        </div>
        
        <article className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {articleData.title}
            </h1>
            
            <div className="flex items-center text-gray-600 mb-8">
              <span className="mr-4">
                By {collection.ownerUsername || 'Unknown'}
              </span>
              <span>
                {new Date(articleData.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div className="prose prose-lg max-w-none whitespace-pre-wrap">
              {articleData.content}
            </div>
          </div>
        </article>
        
        {isOwner && (
          <div className="flex justify-end space-x-4 mt-6">
            <Link 
              to={`/blog/edit/${collection._id}/${articleData.slug}`}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit Article
            </Link>
          </div>
        )}
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">About this blog</h2>
          <p className="text-gray-700 mb-4">{collection.description}</p>
          <Link 
            to={`/${subdomain}`}
            className="text-primary hover:text-primary-dark font-semibold"
          >
            View all articles in {collection.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SubdomainArticle; 