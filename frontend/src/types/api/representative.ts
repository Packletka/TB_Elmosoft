export interface RepresentativeResponse {
  id: number;
  user: number;
  health_organisation: number | null;
}

export interface RepresentativeCreatePayload {
  user: number;
  health_organisation?: number | null;
}

export interface RepresentativeUpdatePayload {
  health_organisation?: number | null;
}
