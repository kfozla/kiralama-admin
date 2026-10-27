import apiClient from "@/app/lib/apiClient";

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
};
export const getLoggedInUser = async () => {
  try {
    const response = await apiClient.get(`/auth/me`);
    return response.data;
  } catch (error) {
    console.error("Error fetching logged-in user:", error);
    throw error;
  }
};
export const logoutUser = async () => {
  try {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Error logging out user:", error);
    throw error;
  } finally {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("authUser");
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }
};
export const refreshToken = async () => {
  try {
    const response = await apiClient.post("/auth/refresh");
    return response.data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
};
