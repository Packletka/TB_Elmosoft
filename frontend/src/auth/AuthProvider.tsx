import axios from "axios";
import { useEffect, useState, type ReactNode } from "react";
import { authApi } from "../api/auth";
import type { MeResponse } from "../types/api/user";
import { AuthContext } from "./AuthContext";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStorage";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const accessToken = getAccessToken();
      if (!accessToken) {
        return;
      }

      try {
        const res = await authApi.getCurrentUser({
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!cancelled) setUser(res.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearTokens();
        }
      }
    }

    restoreSession().finally(() => {
      if (!cancelled) setIsInitialized(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const tokenRes = await authApi.login(email, password);
    const { access, refresh } = tokenRes.data;
    setTokens(access, refresh);

    const meRes = await authApi.getCurrentUser({
      headers: { Authorization: `Bearer ${access}` },
    });
    setUser(meRes.data);
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // still clear local session even if server-side blacklist fails
      }
    }
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isInitialized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
