import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';

const UserBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { username } = useParams();
  
  useEffect(() => {
    const fetchUserBlogs = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/blogs/user/${username}`);
        setBlogs(response.data.blogs || []);
        
        // If we have blogs, set the user from the first blog's author
        if (response.data.blogs.length > 0) {
          setUser({
            name: response.data.blogs[0].author.name,
            username: response.data.blogs[0].authorUsername
          });
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch blogs. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserBlogs();
  }, [username]);

  return (
    <div className="min-h-screen container mx-auto px-4 py-8">
      {/* User Profile Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">
          {user ? `${user.name}'s Blog` : `Blog by ${username}`}
        </h1>
        <p className="text-gray-600">
          Browse through all posts by {user?.name || username}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <div key={blog._id} className="hs-card">
                <div className="h-40 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                  {blog.imageUrl ? (
                    <img
                      src={blog.imageUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-primary">No image</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  <Link
                    to={`/${username}/${blog.slug}`}
                    className="hover:text-primary"
                  >
                    {blog.title}
                  </Link>
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {blog.summary || blog.content?.substring(0, 120) + "..."}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {blog.createdAt
                      ? new Date(blog.createdAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                  <Link
                    to={`/${username}/${blog.slug}`}
                    className="text-primary font-medium hover:underline"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-500">
                No blogs found for this user.
              </p>
              <Link to="/" className="hs-btn hs-btn-primary mt-4">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserBlogs; 