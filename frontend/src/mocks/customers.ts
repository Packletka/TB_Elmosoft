import type { Customer, CustomerSex } from "../types/customer";

export const customers: Customer[] = [
  {
    id: 6,
    last_name: "Smirnova",
    first_name: "Elena",
    patronymic: "Vladimirovna",
    email: "elena.smirnova@example.com",
    sex: "F",
    birthday: "1994-08-12",
    phone: "+375291112233",
    address: "Minsk",
  },
];

export interface CustomerProfileUpdate {
  last_name: string;
  first_name: string;
  patronymic: string;
  sex: CustomerSex;
  birthday: string;
  address: string;
}

export function updateMockCustomerProfile(
  customerId: number,
  updates: CustomerProfileUpdate,
): Customer | null {
  const customer = customers.find((customer) => customer.id === customerId);

  if (!customer) {
    return null;
  }

  Object.assign(customer, updates);

  return customer;
}
