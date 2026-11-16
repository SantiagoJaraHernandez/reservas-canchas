import axios from "axios";

let onLogout = null;

export const setLogoutHandler = (callback) => {
  onLogout = callback;
};

const API_URL =
  window.APP_CONFIG?.API_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";

const axiosClient = axios.create({
  baseURL: API_URL,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && onLogout) {
      onLogout();
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
