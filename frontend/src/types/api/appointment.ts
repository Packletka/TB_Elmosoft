import type { DoctorNestedOrganisation } from "./doctor";

export interface TalonDoctor {
  id: number;
  full_name: string;
  last_name: string;
  first_name: string;
  patronymic: string;
  position: string;
  cabinet: number;
  health_organisation: DoctorNestedOrganisation | null;
}

export interface TalonResponse {
  id: number;
  customer: number | null;
  doctor: TalonDoctor;
  date: string;
  time: string;
  is_free: boolean;
}
