import axios from "axios";

const apiClient = axios.create({
  withCredentials: true,
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// SessionStorage işlemleri yalnızca tarayıcıda yapılır
const getToken = () => {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem("token");
};

const setToken = (token) => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem("token", token);

  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "null");

  if (authUser) {
    authUser.token = token;

    sessionStorage.setItem("authUser", JSON.stringify(authUser));
  }
};

const clearSession = () => {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authUser");

  delete apiClient.defaults.headers.common["Authorization"];
};

// Her request öncesinde token ekle
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.delete("Authorization");
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Token refresh yönetimi
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    // 401 ve daha önce refresh denenmemişse
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest &&
      typeof window !== "undefined"
    ) {
      // Refresh devam ediyorsa kuyruğa ekle
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);

          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // HttpOnly refresh cookie otomatik gönderilir
        const response = await apiClient.post("/auth/refresh");

        const newAccessToken = response.data.accessToken;

        if (!newAccessToken) {
          throw new Error("Refresh token yanıtında accessToken yok.");
        }

        // Yeni token'ı kaydet
        setToken(newAccessToken);

        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;

        // Bekleyen istekleri devam ettir
        processQueue(null, newAccessToken);

        // Başarısız olan isteği tekrar gönder
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Kuyruktaki istekleri reddet
        processQueue(refreshError, null);

        // Oturumu temizle
        clearSession();

        // Login sayfasına yönlendir
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
