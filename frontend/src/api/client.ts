import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "../auth/tokenStorage";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request interceptor: attach the access token to every call ---
apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// --- Response interceptor: auto-refresh on 401 ---

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function isAuthEndpoint(url?: string): boolean {
  // Covers /token/, /token/refresh/, and /token/blacklist/ in one check,
  // since all three share this prefix and none of them should trigger
  // a refresh-and-retry - a 401 from any of them means "bad credentials"
  // or "bad/expired refresh token", not "access token expired".
  return !!url && url.includes("/token/");
}

// Shared across concurrent 401s, so three requests failing at once
// trigger exactly one /token/refresh/ call, not three.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Dynamic import, not a top-level one: auth.ts imports apiClient from
  // this file, so a static import here would create a circular
  // dependency. Deferring it to call-time (only when actually needed)
  // sidesteps that safely.
  const { authApi } = await import("./auth");
  const res = await authApi.refresh(refreshToken);
  setAccessToken(res.data.access);
  return res.data.access;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // The session is genuinely dead - refresh token expired or
      // blacklisted. Clear it so the next /me check or route guard
      // sees a logged-out state. Deliberately NOT redirecting from
      // here: this file sits outside the component tree and has no
      // business owning navigation - that's Step 8's job.
      clearTokens();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
