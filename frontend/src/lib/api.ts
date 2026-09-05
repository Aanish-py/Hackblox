import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gigchain_jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("gigchain_jwt");
      window.dispatchEvent(new Event("gigchain:logout"));
    }
    return Promise.reject(error);
  }
);

export default api;
