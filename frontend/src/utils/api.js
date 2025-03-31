import axios from 'axios';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // More precise check for legacy blog URLs - only match exact pattern
    // Don't match URLs like /blogs/user/ or /blogs/collectionId/articleSlug
    if (config.url && (
      config.url.match(/^\/blogs\/[^\/]+$/) && // Matches ONLY /blogs/id format (legacy)
      !config.url.match(/^\/blogs\/user\//) && // Don't match user routes
      !config.url.match(/^\/blogs\/[^\/]+\/[^\/]+$/) // Don't match collection/slug routes
    )) {
      console.warn(`[LEGACY URL ALERT] Detected request to legacy blog endpoint: ${config.url}`);
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      
      // Special handler for legacy blog 404/410 errors - be more specific
      if ((error.response.status === 404 || error.response.status === 410) && 
          error.config && error.config.url && 
          error.config.url.match(/^\/blogs\/[^\/]+$/) && 
          !error.config.url.includes('/user/')) {
        console.error(`Legacy URL error: ${error.config.url}`);
      }
      
      // If we get a 401 Unauthorized error, the token might be invalid
      if (error.response.status === 401) {
        console.error('Unauthorized request - token might be invalid or expired');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default api; 