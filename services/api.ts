import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/constants/Environment";

// Define custom type that extends axios's internal config type
type CustomRequestConfig = any & {
  _retry?: boolean;
};

// Create a custom axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Variable to track if a token refresh is in progress
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}> = [];

// Process the failed queue - either resolve or reject based on token refresh outcome
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Function to refresh token
const refreshToken = async (): Promise<string | null> => {
  console.log("refreshToken");
  try {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    // Use the refresh token from storage instead of hardcoded value
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );

    // console.log(response, "response");

    const { accessToken, refreshToken: newRefreshToken } = response.data as {
      accessToken: string;
      refreshToken: string;
    };

    // Save the new tokens
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", newRefreshToken);

    return accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // Clear tokens if refresh fails - user needs to login again
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    return null;
  }
};

// Request interceptor to add auth token to every request
api.interceptors.request.use(
  async (config: any) => {
    const token = await AsyncStorage.getItem("accessToken");
    // Use the token from storage instead of hardcoded value
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error),
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config as CustomRequestConfig;

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh is already in progress, add this request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Start refreshing token
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();

        if (!newToken) {
          // If refresh failed, reject with original error
          processQueue(new Error("Failed to refresh token"));
          return Promise.reject(error);
        }

        // Process pending requests with new token
        processQueue(null, newToken);

        // Update the original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request with new token
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
