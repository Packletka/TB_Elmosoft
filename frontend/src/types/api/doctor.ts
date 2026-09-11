import type { Weekday } from "./common";

export type DoctorWorkSchedule = Partial<
  Record<Weekday, { start: string; finish: string }>
>;

export interface DoctorNestedOrganisation {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  site: string;
}

export interface DoctorResponse {
  id: number;
  full_name: string;
  last_name: string;
  first_name: string;
  patronymic: string;
  position: string;
  cabinet: number;
  slot_duration: number;
  health_organisation: DoctorNestedOrganisation | null;
  work_schedule: DoctorWorkSchedule;
}
