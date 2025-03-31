import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function EditBlogCollection() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    coverImage: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { message: 'Please log in to edit your blog' } });
      return;
    }

    fetchCollection();
  }, [id, token, navigate]);

  const fetchCollection = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/blog-collections/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { name, description, isPublic, coverImage } = response.data;
      setFormData({
        name,
        description,
        isPublic: isPublic !== undefined ? isPublic : true,
        coverImage: coverImage || ''
      });
      
      setServerError(null);
    } catch (error) {
      console.error('Error fetching blog collection:', error);
      if (error.response?.status === 404) {
        setServerError('Blog not found. It may have been deleted.');
      } else if (error.response?.status === 403) {
        setServerError('You do not have permission to edit this blog.');
      } else {
        setServerError('Failed to load the blog. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Blog name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Blog name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Blog name must be less than 50 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.coverImage && !isValidUrl(formData.coverImage)) {
      newErrors.coverImage = 'Please enter a valid URL for the cover image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!token) {
      navigate('/login', { state: { message: 'Please log in to edit your blog collection' } });
      return;
    }
    
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/blog-collections/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Blog collection updated:', response.data);
      navigate('/my-collections', { state: { message: 'Blog collection updated successfully!' } });
    } catch (error) {
      console.error('Error updating blog collection:', error);
      if (error.response?.data?.error) {
        setServerError(error.response.data.error);
      } else {
        setServerError('An error occurred while updating your blog collection. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">Edit Your Blog</h1>
        
        {serverError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {serverError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8">
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
              Blog Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded focus:outline-none focus:ring-2 ${
                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-light'
              }`}
              placeholder="Enter a name for your blog"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className={`w-full p-3 border rounded focus:outline-none focus:ring-2 ${
                errors.description ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-light'
              }`}
              placeholder="Describe what your blog is about"
            ></textarea>
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
          
          <div className="mb-6">
            <label htmlFor="coverImage" className="block text-gray-700 font-semibold mb-2">
              Cover Image URL (optional)
            </label>
            <input
              type="text"
              id="coverImage"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded focus:outline-none focus:ring-2 ${
                errors.coverImage ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-light'
              }`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.coverImage && <p className="text-red-500 text-sm mt-1">{errors.coverImage}</p>}
            {formData.coverImage && !errors.coverImage && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Preview:</p>
                <img 
                  src={formData.coverImage} 
                  alt="Cover preview" 
                  className="h-40 object-cover rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    setErrors({...errors, coverImage: 'Image URL is invalid or inaccessible'});
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="h-5 w-5 text-primary focus:ring-primary-light"
              />
              <span className="ml-2 text-gray-700">Make this blog public</span>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {formData.isPublic 
                ? 'Anyone can view this blog and its articles.' 
                : 'Only you can view this blog and its articles.'}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/my-collections')}
              className="bg-gray-300 text-gray-800 px-6 py-3 rounded hover:bg-gray-400 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-primary text-white px-6 py-3 rounded ${
                isSubmitting 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:bg-primary-dark transition-colors duration-200'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditBlogCollection; 