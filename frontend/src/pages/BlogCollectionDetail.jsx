import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

function BlogCollectionDetail() {
  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/blog-collections/${id}`);
      setCollection(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching blog collection:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('This blog is private. You need to be logged in to view it.');
      } else {
        setError('Failed to load the blog. It may not exist or has been removed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateArticle = () => {
    navigate('/create', { state: { blogCollectionId: id } });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-300 rounded w-3/4 mx-auto mb-6"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-4xl mx-auto">
          {error}
        </div>
        <div className="text-center mt-6">
          <Link 
            to="/"
            className="text-primary hover:text-primary-dark underline"
          >
            Return to home page
          </Link>
        </div>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  const isOwner = user && collection.owner === user.id;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-primary rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-4">{collection.name}</h1>
          <p className="text-lg mb-6">{collection.description}</p>
          
          <div className="flex justify-between items-center">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {collection.isPublic ? 'Public Blog' : 'Private Blog'}
            </span>
            
            {isOwner && (
              <button 
                onClick={handleCreateArticle} 
                className="bg-white text-primary hover:bg-gray-100 font-medium py-2 px-6 rounded-lg transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Add New Article
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Articles</h2>
            
            {isOwner && (
              <button 
                onClick={handleCreateArticle} 
                className="md:hidden bg-primary text-white hover:bg-primary-dark font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add Article
              </button>
            )}
          </div>
          
          {collection.articles?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collection.articles.map(article => (
                <div key={article._id || article.slug} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/blog/collection/${collection._id}/${article.slug}`} className="block p-6">
                    <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">{article.title}</h3>
                    <p className="text-gray-600 line-clamp-3">
                      {article.content?.substring(0, 150)}...
                    </p>
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <p className="text-gray-600 mb-6">This blog doesn't have any articles yet.</p>
              {isOwner && (
                <button 
                  onClick={handleCreateArticle} 
                  className="bg-primary text-white font-medium py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Create Your First Article
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlogCollectionDetail; 