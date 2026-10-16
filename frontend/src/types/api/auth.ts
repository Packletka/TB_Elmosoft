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

export interface PasswordResetPayload {
  uid: string;
  token: string;
  new_password: string;
}

// Both password recovery endpoints answer with a single sentence.
export interface DetailResponse {
  detail: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

// A fresh token pair comes with the answer: the change ends every session, this device's included
export type PasswordChangeResponse = DetailResponse & TokenPairResponse;

export interface EmailChangePayload {
  new_email: string;
  current_password: string;
}

// The address comes back as the server saved it: the part after @ is lowercased
export type EmailChangeResponse = DetailResponse & { email: string };
