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
    if (!formData.name.trim()) newErrors.name = "Blog name is required";
    if (!formData.subdomain.trim())
      newErrors.subdomain = "Blog URL is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (formData.coverImage && !isValidUrl(formData.coverImage))
      newErrors.coverImage = "Invalid cover image URL";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    });
    if (name === "name" && !formData.subdomain) {
      setFormData((prev) => ({
        ...prev,
        subdomain: value.toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-"),
      }));
    }
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate("/login", {
        state: { message: "Please log in to create a blog collection" },
      });
      return;
    }
    if (!validateForm()) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_BASE_URL}/api/blog-collections`;
      await axios.post(apiUrl, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/my-collections", {
        state: { message: "Blog created successfully!" },
      });
    } catch (error) {
      if (error.response?.data?.error) {
        if (error.response.status === 409) {
          setErrors({
            ...errors,
            subdomain: "This blog URL is already taken.",
          });
        } else {
          setServerError(error.response.data.error);
        }
      } else {
        setServerError("An error occurred. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">
          Create Your Blog
        </h1>
        {serverError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {serverError}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-8"
        >
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-gray-700 font-semibold mb-2"
            >
              Blog Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter a name for your blog"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          <div className="mb-6">
            <label
              htmlFor="subdomain"
              className="block text-gray-700 font-semibold mb-2"
            >
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
                className={`flex-1 p-3 border-y border-r rounded-r ${
                  errors.subdomain ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="your-blog-name"
              />
              <div className="bg-gray-100 border border-l-0 rounded-r p-3 text-gray-500">
                .blogify.com
              </div>
            </div>
            {errors.subdomain && (
              <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>
            )}
          </div>
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-gray-700 font-semibold mb-2"
            >
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className={`w-full p-3 border rounded ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe what your blog is about"
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>
          <div className="mb-6">
            <label
              htmlFor="coverImage"
              className="block text-gray-700 font-semibold mb-2"
            >
              Cover Image URL (optional)
            </label>
            <input
              type="text"
              id="coverImage"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded ${
                errors.coverImage ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.coverImage && (
              <p className="text-red-500 text-sm mt-1">{errors.coverImage}</p>
            )}
          </div>
          <div className="mb-8">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="h-5 w-5 text-primary"
              />
              <span className="ml-2 text-gray-700">Make this blog public</span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-300 text-gray-800 px-6 py-3 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-primary text-white px-6 py-3 rounded ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Creating..." : "Create Blog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBlogCollection; 