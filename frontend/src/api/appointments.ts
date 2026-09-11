import apiClient from "./client";
import type { TalonResponse } from "../types/api/appointment";

export const appointmentApi = {
  getAppointments() {
    return apiClient.get<TalonResponse[]>("/appointment");
  },

  getAvailableTalons(doctorId: number, date: string) {
    return apiClient.get<TalonResponse[]>(
      `/appointment?doctor=${doctorId}&date=${date}&free=true&active=true`,
    );
  },

  bookTalon(id: number) {
    return apiClient.post<TalonResponse>(`/appointment/${id}/book`);
  },

  cancelTalon(id: number) {
    return apiClient.post<TalonResponse>(`/appointment/${id}/cancel`);
  },
};
