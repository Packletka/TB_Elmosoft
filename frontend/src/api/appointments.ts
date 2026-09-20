import apiClient from "./client";
import type { TalonResponse } from "../types/api/appointment";

export const appointmentApi = {
  getAppointments() {
    return apiClient.get<TalonResponse[]>("/appointment");
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

  bookTalon(id: number) {
    return apiClient.post<TalonResponse>(`/appointment/${id}/book`);
  },

  cancelTalon(id: number) {
    return apiClient.post<TalonResponse>(`/appointment/${id}/cancel`);
  },
};
