import type { CustomerSex } from "../customer";
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
