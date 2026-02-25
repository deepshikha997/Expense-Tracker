import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 15000,
});

let unauthorizedHandler = null;

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestPath = error?.config?.url || "";
    const isAuthEndpoint = requestPath.includes("/auth/login") || requestPath.includes("/auth/signup");

    if (status === 401 && !isAuthEndpoint && typeof unauthorizedHandler === "function") {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);

export default api;
