import type { CustomerSex } from "../customer";
import type { DoctorWorkSchedule } from "./doctor";

export type UserRole =
  "admin" | "customer" | "doctor" | "representative" | null;

export interface CustomerProfile {
  sex: CustomerSex;
  birthday: string;
  phone: string;
  address: string;
}

export interface DoctorProfile {
  position: string;
  cabinet: number;
  work_schedule: DoctorWorkSchedule;
  slot_duration: number;
  health_organisation_id: number | null;
}

export interface RepresentativeProfile {
  health_organisation_id: number | null;
}

interface BaseUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  patronymic: string;
}

export type MeResponse =
  | (BaseUser & { role: "customer"; profile: CustomerProfile })
  | (BaseUser & { role: "doctor"; profile: DoctorProfile })
  | (BaseUser & { role: "representative"; profile: RepresentativeProfile })
  | (BaseUser & { role: "admin"; profile: null })
  | (BaseUser & { role: null; profile: null });
