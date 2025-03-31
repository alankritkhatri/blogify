import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateBlog from './pages/CreateBlog';
import BlogDetail from './pages/BlogDetail';
import EditBlog from './pages/EditBlog';
import UserBlogs from './pages/UserBlogs';
import MyBlogCollections from './pages/MyBlogCollections';
import CreateBlogCollection from './pages/CreateBlogCollection';
import BlogCollectionDetail from './pages/BlogCollectionDetail';
import EditBlogCollection from './pages/EditBlogCollection';
import SubdomainBlog from './pages/SubdomainBlog';
import SubdomainArticle from './pages/SubdomainArticle';
import ProtectedRoute from './components/ProtectedRoute';
import api from './utils/api';

import './styles/tailwind.css';

function LegacyUrlHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectMsg, setRedirectMsg] = useState(null);
  
  useEffect(() => {
    const legacyUrlMatch = location.pathname.match(/^\/blog\/([^\/]+)$/);
    const isNewFormat = location.pathname.includes('/blog/collection/');
    
    if (legacyUrlMatch && !isNewFormat) {
      const blogId = legacyUrlMatch[1];
      
      const checkLegacyUrl = async () => {
        try {
          const response = await api.get(`/blogs/${blogId}`);
          
          if (response.data && response.data.code === 'REDIRECT_TO_NEW_FORMAT') {
            navigate(`/blog/collection/${response.data.collectionId}/${response.data.articleSlug}`, { replace: true });
            return;
          }
        } catch (err) {
          console.error('Error fetching legacy blog:', err);
        }
        
        setRedirectMsg(`The URL format you're using is outdated. Please use My Blogs to access your content.`);
        
        setTimeout(() => {
          setRedirectMsg(null);
        }, 5000);
      };
      
      checkLegacyUrl();
    }
  }, [location, navigate]);
  
  if (redirectMsg) {
    return (
      <div className="fixed top-20 left-0 right-0 mx-auto max-w-md bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md z-50 animate-fade-in">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p>{redirectMsg}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}

function App() {
  return (
    <div className="min-h-screen bg-background-light">
      <Navbar />
      <LegacyUrlHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
        <Route path="/blog/collection/:collectionId/:articleSlug" element={<BlogDetail />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/blog/edit/:id" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
        <Route path="/blog/edit/:collectionId/:articleSlug" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
        <Route path="/my-collections" element={<ProtectedRoute><MyBlogCollections /></ProtectedRoute>} />
        <Route path="/create-collection" element={<ProtectedRoute><CreateBlogCollection /></ProtectedRoute>} />
        <Route path="/edit-collection/:id" element={<ProtectedRoute><EditBlogCollection /></ProtectedRoute>} />
        <Route path="/collections/:id" element={<BlogCollectionDetail />} />
        
        <Route path="/:subdomain" element={<SubdomainBlog />} />
        <Route path="/:subdomain/:slug" element={<SubdomainArticle />} />
        
        <Route path="/user/:username" element={<UserBlogs />} />
        <Route path="/user/:username/:slug" element={<BlogDetail />} />
      </Routes>
    </div>
  );
}

export default App;
