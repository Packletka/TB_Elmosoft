import apiClient from "./client";
import type {
  CustomerResponse,
  CustomerUpdatePayload,
} from "../types/api/customer";

export const customerApi = {
  getCustomer(id: number) {
    return apiClient.get<CustomerResponse>(`/customer/${id}`);
  },

  updateCustomer(id: number, data: CustomerUpdatePayload) {
    return apiClient.patch<CustomerResponse>(`/customer/${id}`, data);
  },

  deleteCustomer(id: number) {
    return apiClient.delete<void>(`/customer/${id}`);
  },
};
