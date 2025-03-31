import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { token, logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  
  const handleLogout = () => {
    logout();
    closeMenu();
  };
  
  const goToBlogs = () => {
    navigate('/my-collections');
    closeMenu();
  };

  return (
    <nav className="bg-white py-4 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center no-underline">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-2">
              <span className="text-white font-bold">B</span>
            </div>
            <span className="text-gray-800 text-xl font-bold">blogify</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className="px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 font-medium">
              Home
            </Link>
            
            {token ? (
              <>
                {user && (
                  <span className="px-3 py-2 text-gray-600">
                    <span className="font-medium">{user.username || user.name || user.email}</span>
                  </span>
                )}
                <Link to="/my-collections" className="px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 font-medium">
                  My Blogs
                </Link>
                <Link to="/create" className="hs-btn hs-btn-secondary">
                  Write Article
                </Link>
                <button onClick={logout} className="hs-btn hs-btn-primary ml-2">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 font-medium">
                  Log in
                </Link>
                <Link to="/register" className="hs-btn hs-btn-primary ml-2">
                  Create Blog
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 p-2"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-16 mt-2 w-48 bg-white rounded-2xl shadow-lg py-2 z-10">
                <Link to="/" onClick={closeMenu} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Home
                </Link>
                {token && (
                  <>
                    {user && (
                      <div className="block px-4 py-2 text-gray-700 font-medium border-b border-gray-100">
                        {user.username || user.name || user.email}
                      </div>
                    )}
                    <Link to="/my-collections" onClick={closeMenu} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      My Blogs
                    </Link>
                  </>
                )}
                <Link to="/explore" onClick={closeMenu} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Explore
                </Link>
                <Link to="/about" onClick={closeMenu} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  About
                </Link>
                {token ? (
                  <>
                    <Link to="/my-collections" onClick={closeMenu} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Write Article
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMenu} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Login
                    </Link>
                    <Link to="/register" onClick={closeMenu} className="block px-4 py-2 text-primary font-medium hover:bg-blue-50">
                      Try for free
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;