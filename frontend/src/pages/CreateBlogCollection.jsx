import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateBlogCollection() {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    isPublic: true,
    coverImage: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Blog name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Blog name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Blog name must be less than 50 characters';
    }
    
    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Blog URL is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Blog URL can only contain lowercase letters, numbers, and hyphens';
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = 'Blog URL must be at least 3 characters';
    } else if (formData.subdomain.length > 30) {
      newErrors.subdomain = 'Blog URL must be less than 30 characters';
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
    

    if (name === "subdomain") {
      const formattedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }

    if (name === "name" && !formData.subdomain) {
      const subdomain = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

      setFormData((prev) => ({
        ...prev,
        subdomain,
      }));
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      navigate('/login', { state: { message: 'Please log in to create a blog collection' } });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    console.log(import.meta.env.VITE_BASE_URL)
    if (!import.meta.env.VITE_BASE_URL) {
      setServerError('API URL is not defined. Please check your environment configuration.');
      console.error('VITE_BASE_URL is undefined in environment variables');
      return;
    }
    
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      const apiUrl = `${import.meta.env.VITE_BASE_URL}/api/blog-collections`;
      console.log('Sending request to:', apiUrl);
      console.log('With data:', formData);
      console.log('With headers:', { Authorization: `Bearer ${token}` });
      
      const response = await axios.post(
        apiUrl,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Blog collection created:', response.data);
      navigate('/my-collections', { state: { message: 'Blog created successfully! You can now add articles to it.' } });
    } catch (error) {
      console.error('Error creating blog collection:', error);
      if (error.response?.data?.error) {
        if (error.response.status === 409 && error.response.data.error.includes('subdomain')) {
          setErrors({
            ...errors,
            subdomain: 'This blog URL is already taken. Please choose another one.'
          });
        } else {
          setServerError(error.response.data.error);
        }
      } else {
        setServerError('An error occurred while creating your blog. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">Create Your Blog</h1>
        
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
            <label htmlFor="subdomain" className="block text-gray-700 font-semibold mb-2">
              Blog URL*
            </label>
            <div className="flex items-center">
              <div className="bg-gray-100 border border-r-0 rounded-l p-3 text-gray-500">
                https://
              </div>
              <input
                type="text"
                id="subdomain"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleInputChange}
                className={`flex-1 p-3 border-y border-r rounded-r focus:outline-none focus:ring-2 ${
                  errors.subdomain ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-light'
                }`}
                placeholder="your-blog-name"
              />
              <div className="bg-gray-100 border border-l-0 rounded-r p-3 text-gray-500">
                .blogify.com
              </div>
            </div>
            {errors.subdomain && <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>}
            <p className="text-sm text-gray-500 mt-1">
              This will be the URL of your blog. It cannot be changed later.
            </p>
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
              onClick={() => navigate(-1)}
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
              {isSubmitting ? 'Creating...' : 'Create Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBlogCollection; 