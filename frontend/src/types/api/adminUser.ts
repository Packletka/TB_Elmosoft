export interface AdminUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  patronymic: string;
  home_organisation: number | null;
}

export interface AdminUserCreatePayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
  home_organisation?: number | null;
}

export interface AdminUserUpdatePayload {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  patronymic?: string;
  home_organisation?: number | null;
}
