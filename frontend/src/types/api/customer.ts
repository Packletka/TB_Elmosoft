import type { CustomerSex } from "./common";

export interface CustomerResponse {
  id: number;
  user: number;
  sex: CustomerSex;
  birthday: string;
  phone: string;
  address: string;
}

export interface CustomerUpdatePayload {
  sex?: CustomerSex;
  birthday?: string;
  phone?: string;
  address?: string;
}
