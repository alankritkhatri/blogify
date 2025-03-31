import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

function MyBlogCollections() {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please log in to view your blog collections' } });
      return;
    }

    fetchCollections();
  }, [isAuthenticated, navigate]);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/blog-collections/my-collections');
      setCollections(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching blog collections:', err);
      setError('Failed to load your blog collections. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog collection? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/blog-collections/${id}`);
      setCollections(collections.filter(collection => collection._id !== id));
    } catch (err) {
      console.error('Error deleting blog collection:', err);
      setError('Failed to delete the blog collection. Please try again later.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-300 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">My Blogs</h1>
        <Link 
          to="/create-collection" 
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors duration-200"
        >
          Create New Blog
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-8 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">You don't have any blogs yet</h2>
          <p className="mb-6 text-gray-600">Create your first blog to start organizing your articles.</p>
          <Link 
            to="/create-collection"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            Create Your First Blog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map(collection => (
            <div 
              key={collection._id} 
              className="border border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              {collection.coverImage && (
                <img 
                  src={collection.coverImage} 
                  alt={collection.name}
                  className="w-full h-48 object-cover"
                />
              )}
              {!collection.coverImage && (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No Cover Image</span>
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{collection.name}</h2>
                {collection.subdomain && (
                  <div className="mb-3 text-sm">
                    <Link 
                      to={`/${collection.subdomain}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {collection.subdomain}.blogify.com
                    </Link>
                  </div>
                )}
                <p className="text-gray-700 mb-4 line-clamp-3">{collection.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">
                      {collection.articles?.length || 0} Articles
                    </span>
                    {!collection.isPublic && (
                      <span className="ml-2 bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      to={collection.subdomain ? `/${collection.subdomain}` : `/collections/${collection._id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      View
                    </Link>
                    <Link 
                      to={`/edit-collection/${collection._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(collection._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBlogCollections; 