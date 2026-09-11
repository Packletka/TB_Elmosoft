import type { CustomerSex } from "./customer";

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
