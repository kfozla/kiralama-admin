import axios from "axios";

import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "@/app/lib/authToken";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 10000,
});

// Tek sekmede aynı anda gelen refresh isteklerini birleştirir.

let refreshPromise = null;

export async function refreshAccessToken() {
  // Aynı sekmedeki refresh isteklerini birleştir.
  if (refreshPromise) {
    return refreshPromise;
  }

  const performRefresh = async () => {
    const { data } = await apiClient.post("/auth/refresh", null, {
      _skipAuthRefresh: true,
    });

    if (!data?.accessToken) {
      throw new Error("Refresh yanıtında accessToken bulunamadı.");
    }

    setAccessToken(data.accessToken);

    return data.accessToken;
  };

  const refreshWithLock = async () => {
    // Web Locks desteklenmiyorsa eski davranış.
    if (typeof navigator === "undefined" || !navigator.locks?.request) {
      return performRefresh();
    }

    return navigator.locks.request(
      "kiralama-auth-refresh",
      { mode: "exclusive" },
      async () => {
        // Kilidi alan sekme refresh yapar.
        // Diğer sekmeler işlem bitene kadar bekler.
        return performRefresh();
      },
    );
  };

  refreshPromise = refreshWithLock()
    .catch((error) => {
      clearAccessToken();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Her isteğe bellekteki access token eklenir.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers.delete("Authorization");
  }

  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

// Access token geçersizse yenile ve isteği tekrarla.
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";

    const isAuthRequest =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest._skipAuthRefresh ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();

      originalRequest.headers.set("Authorization", `Bearer ${newToken}`);

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.replace("/login");
      }

      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
