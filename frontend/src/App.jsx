import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateBlog from "./pages/CreateBlog";
import BlogDetail from "./pages/BlogDetail";
import EditBlog from "./pages/EditBlog";

import MyBlogCollections from "./pages/MyBlogCollections";
import CreateBlogCollection from "./pages/CreateBlogCollection";
import BlogCollectionDetail from "./pages/BlogCollectionDetail";
import EditBlogCollection from "./pages/EditBlogCollection";
import SubdomainBlog from "./pages/SubdomainBlog";
import SubdomainArticle from "./pages/SubdomainArticle";
import ProtectedRoute from "./components/ProtectedRoute";

import "./styles/tailwind.css";

function App() {
  return (
    <div className="min-h-screen bg-background-light">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog/collection/:collectionId/:articleSlug"
          element={<BlogDetail />}
        />
        <Route
          path="/blog/edit/:collectionId/:articleSlug"
          element={
            <ProtectedRoute>
              <EditBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-collections"
          element={
            <ProtectedRoute>
              <MyBlogCollections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-collection"
          element={
            <ProtectedRoute>
              <CreateBlogCollection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-collection/:id"
          element={
            <ProtectedRoute>
              <EditBlogCollection />
            </ProtectedRoute>
          }
        />
        <Route path="/collections/:id" element={<BlogCollectionDetail />} />
        <Route path="/:subdomain" element={<SubdomainBlog />} />
        <Route path="/:subdomain/:slug" element={<SubdomainArticle />} />
        <Route path="/user/:username/:slug" element={<BlogDetail />} />
      </Routes>
    </div>
  );
}

export default App;
