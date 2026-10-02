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

export interface TalonCustomer {
  last_name: string;
  first_name: string;
  patronymic: string;
  phone: string;
}

export interface TalonResponse {
  id: number;
  customer: TalonCustomer | null;
  doctor: TalonDoctor;
  date: string;
  time: string;
  is_free: boolean;
}

export interface TalonCreatePayload {
  /**
   * Optional for a doctor: the backend uses the requesting doctor's own record.
   * If a doctor sends it anyway, it must be their own id, otherwise the API
   * responds with 403.
   * Required for a representative or admin (400 "required" if omitted).
   */
  doctor_id?: number;

  /** Date as "YYYY-MM-DD". */
  date: string;

  /** Time as "HH:MM". Responses return "HH:MM:SS". */
  time: string;
}
