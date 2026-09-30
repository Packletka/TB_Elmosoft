import type { MeResponse } from "./user";
import type { CustomerSex } from "./common";

export interface TokenPairResponse {
  access: string;
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
  sex: CustomerSex;
  birthday: string; // "YYYY-MM-DD"
  phone: string;
  address?: string;
}

export type RegisterResponse = Extract<MeResponse, { role: "customer" }>;
