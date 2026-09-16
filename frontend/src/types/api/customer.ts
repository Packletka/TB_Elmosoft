import type { CustomerSex } from "../customer";

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
