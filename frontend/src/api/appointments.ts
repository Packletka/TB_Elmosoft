import apiClient from "./client";
import type {
  TalonResponse,
  TalonCreatePayload,
} from "../types/api/appointment";

export const appointmentApi = {
  getAppointments({
    active = true,
    doctorId,
  }: { active?: boolean; doctorId?: number } = {}) {
    return apiClient.get<TalonResponse[]>("/appointment", {
      params: {
        ...(active ? { active } : {}),
        ...(doctorId !== undefined ? { doctor: doctorId } : {}),
      },
    });
  },

  getAvailableTalons(doctorId: number, date?: string) {
    return apiClient.get<TalonResponse[]>("/appointment", {
      params: {
        doctor: doctorId,
        free: true,
        active: true,
        ...(date ? { date } : {}),
      },
    });
  },

  getTalon(id: number) {
    return apiClient.get<TalonResponse>(`/appointment/${id}`);
  },

  createTalon(data: TalonCreatePayload) {
    return apiClient.post<TalonResponse>("/appointment", data);
  },

  deleteTalon(id: number) {
    return apiClient.delete<void>(`/appointment/${id}`);
  },

  bookTalon(id: number) {
    return apiClient.post<TalonResponse>(`/appointment/${id}/book`);
  },

  cancelTalon(id: number) {
    return apiClient.post<TalonResponse>(`/appointment/${id}/cancel`);
  },
};
