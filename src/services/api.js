import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

// Dev (npm run dev) → lokal backend, prod build → canlı API.
// Lazım olsa VITE_API_URL ilə override etmək olar.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5276/api" : "https://api.shafransa.com/api");

const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    try {
      const token = useAuthStore.getState().token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Remove Content-Type so Axios/browser can set boundary for multipart overrides
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
        if (config.headers.common) {
          delete config.headers.common["Content-Type"];
        }
      }

      const lang = localStorage.getItem("lang") || "az";
      config.headers["Accept-Language"] = lang;

      return config;
    } catch (error) {
      console.error("❌ Request interceptor error:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// 📥 RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    // ✅ Backend wraps response in { statusCode, message, data }
    // Extract the actual data from the nested structure
    if (response.data?.data !== undefined) {
      // If there is pagination metadata at the root level, return both
      if (response.data.pagination !== undefined || response.data.Pagination !== undefined) {
        return {
          data: response.data.data,
          pagination: response.data.pagination || response.data.Pagination
        };
      }
      return response.data.data; // Return the actual data object
    }
    return response.data || response;
  },
  (error) => {
    // 🚨 Handle different types of errors
    const status = error.response?.status;
    const errorData = error.response?.data;
    const message = errorData?.message || error.message;

    console.error(`❌ API Error [${status}]:`, message);

    // 🔐 Handle 401 Unauthorized
    // Wrong credentials / OTP on auth endpoints — let the page show the error instead of reloading.
    if (status === 401 && error.config?.url?.startsWith("/auth/")) {
      return Promise.reject({
        status: 401,
        message: errorData?.message || "Invalid credentials.",
      });
    }

    if (status === 401) {
      console.warn("🔐 Unauthorized - Logging out user");
      useAuthStore.getState().logout();
      window.location.href = "/login";
      return Promise.reject({
        status: 401,
        message: "Your session has expired. Please log in again.",
      });
    }

    // 🚫 Handle 403 Forbidden
    if (status === 403) {
      console.warn("🚫 Forbidden - Access denied");
      return Promise.reject({
        status: 403,
        message: "You don't have permission to perform this action.",
      });
    }

    // 404 Not Found
    if (status === 404) {
      return Promise.reject({
        status: 404,
        code: errorData?.error || null,
        message: errorData?.message || "Resource not found.",
      });
    }

    // 400 Bad Request / Validation Error
    if (status === 400 || status === 422) {
      return Promise.reject({
        status: status,
        code: errorData?.error || null, // backend xəta kodu, məs. EMAIL_NOT_VERIFIED
        message: errorData?.message || "Invalid request data.",
        errors: errorData?.errors || null,
      });
    }

    // 429 Too Many Requests
    if (status === 429) {
      return Promise.reject({
        status: 429,
        code: errorData?.error || "TOO_MANY_ATTEMPTS",
        message: errorData?.message || "Too many requests. Please wait a moment and try again.",
      });
    }

    // 500+ Server Errors
    if (status && status >= 500) {
      console.error("🔴 Server error:", error.response);
      return Promise.reject({
        status: status,
        message: "Server error. Our team has been notified.",
      });
    }

    // Network Error
    if (!error.response) {
      console.error("🌐 Network error:", error.message);
      if (error.code === "ECONNABORTED") {
        return Promise.reject({
          status: 0,
          message: "Request timeout. Please check your connection and try again.",
        });
      }
      return Promise.reject({
        status: 0,
        message: "Network error. Please check your internet connection.",
      });
    }

    // Fallback error
    return Promise.reject({
      status: status || 0,
      message: message || "An unexpected error occurred.",
    });
  }
);

export default api;
