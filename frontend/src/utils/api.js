import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api`,
});

api.interceptors.request.use(
  (config) => {
    if (
      config.url &&
      config.url.match(/^\/blogs\/[^\/]+$/) &&
      !config.url.match(/^\/blogs\/user\//) &&
      !config.url.match(/^\/blogs\/[^\/]+\/[^\/]+$/)
    ) {
      console.warn(
        `[LEGACY URL ALERT] Detected request to legacy blog endpoint: ${config.url}`
      );
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (
        (error.response.status === 404 || error.response.status === 410) &&
        error.config &&
        error.config.url &&
        error.config.url.match(/^\/blogs\/[^\/]+$/) &&
        !error.config.url.includes("/user/")
      ) {
        console.error(`Legacy URL error: ${error.config.url}`);
      }

      if (error.response.status === 401) {
        console.error(
          "Unauthorized request - token might be invalid or expired"
        );
      }
    } else if (error.request) {
      console.error("No response received:", error.request);

      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api; 