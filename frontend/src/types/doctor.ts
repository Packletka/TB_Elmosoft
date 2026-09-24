export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  patronymic: string;
  health_organisation: number | null;
  position: string;
  cabinet: string;
}
