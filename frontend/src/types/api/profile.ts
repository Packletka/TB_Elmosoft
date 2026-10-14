import type { DetailResponse } from "./auth";
import type { CustomerSex } from "./common";
import type { DoctorWorkSchedule } from "./doctor";

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  patronymic?: string;
}

export interface CustomerProfileUpdatePayload {
  sex?: CustomerSex;
  birthday?: string;
  address?: string;
}

export interface DoctorProfileUpdatePayload {
  position?: string;
  cabinet?: number;
  work_schedule?: DoctorWorkSchedule;
  slot_duration?: number;
}

export type UpdateMePayload =
  | (UserUpdatePayload & { profile?: CustomerProfileUpdatePayload })
  | (UserUpdatePayload & { profile?: DoctorProfileUpdatePayload })
  | UserUpdatePayload;

export interface PhoneChangeRequestPayload {
  phone: string;
}

export interface PhoneChangeConfirmPayload {
  code: string;
}

// The number comes back as the server stored it: international format, no spaces
export type PhoneChangeConfirmResponse = DetailResponse & { phone: string };
