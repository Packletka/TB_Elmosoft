import type { Weekday } from "./common";

export type OrganisationSchedule = Record<
  Weekday,
  { open: string; close: string }
>;

export interface HealthOrganisationResponse {
  id: number;
  name: string;
  address: string;
  general_info: string;
  phone: string;
  email: string;
  site: string;
  schedule: OrganisationSchedule;
}
