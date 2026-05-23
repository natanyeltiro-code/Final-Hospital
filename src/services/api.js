import axios from "axios";

function normalizeBaseUrl(url) {
  return (url || "").trim().replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (envUrl) return envUrl;

  if (import.meta.env.DEV) return "http://localhost:3000";

  // Production fallback targets Vercel serverless function route.
  return "/api";
}

const API_BASE_URL = resolveApiBaseUrl();

if (!import.meta.env.DEV && !normalizeBaseUrl(import.meta.env.VITE_API_URL)) {
  console.warn(
    "[api] VITE_API_URL is not set. Using /api on same origin. If your backend is hosted elsewhere, set VITE_API_URL in Vercel environment variables."
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Avoid double `/api` when baseURL is `/api` and request paths already start with `/api/...`.
api.interceptors.request.use((config) => {
  const base = normalizeBaseUrl(config.baseURL || "");
  if (base === "/api" && typeof config.url === "string" && config.url.startsWith("/api/")) {
    config.url = config.url.slice(4) || "/";
  }
  return config;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("authToken", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("authToken");
  }
}

const storedToken = localStorage.getItem("authToken");
if (storedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
}

export default api;
