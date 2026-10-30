import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL,
  timeout: 20000, // 20s pour tolérer la latence internationale
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse : Retry automatique en cas de coupure réseau + Refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. Retry automatique sur erreur réseau ou timeout (max 2 tentatives)
    const isNetworkError =
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.message?.includes("Network Error") ||
      error.message?.includes("timeout");

    if (isNetworkError) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 2) {
        const delay = originalRequest._retryCount * 400;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

    // 2. Renouvellement automatique du token en cas d'expiration (401)
    if (error.response?.status === 401 && !originalRequest._authRetry) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        originalRequest._authRetry = true;

        try {
          const res = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (res.data?.access_token) {
            localStorage.setItem("access_token", res.data.access_token);
            if (res.data.refresh_token) {
              localStorage.setItem("refresh_token", res.data.refresh_token);
            }

            originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

