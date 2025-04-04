import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const tokenStorage = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) =>
    token
      ? localStorage.setItem("token", token)
      : localStorage.removeItem("token"),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },
  setUser: (user) =>
    user
      ? localStorage.setItem("user", JSON.stringify(user))
      : localStorage.removeItem("user"),
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(tokenStorage.getToken());
  const [user, setUser] = useState(tokenStorage.getUser());
  const [error, setError] = useState(null);

  const setTokenAndUser = (newToken, newUser) => {
    tokenStorage.setToken(newToken);
    tokenStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch {
        setTokenAndUser(null, null);
      }
    };
    validateToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      setTokenAndUser(response.data.token, response.data.user);
    } catch {
      setError("Login failed. Please check your credentials.");
    }
  };

  const register = async (name, email, password, username) => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        username,
      });
      setTokenAndUser(response.data.token, response.data.user);
    } catch {
      setError("Registration failed. Please try again.");
    }
  };

  const logout = () => setTokenAndUser(null, null);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;