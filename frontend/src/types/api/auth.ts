import type { MeResponse } from "./user";

export interface TokenPairResponse {
  access: string;
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

export type RegisterResponse = Extract<MeResponse, { role: "customer" }>;
