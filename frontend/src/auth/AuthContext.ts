import { createContext } from "react";
import type { MeResponse } from "../types/api/user";

export interface AuthContextValue {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
