import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
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
