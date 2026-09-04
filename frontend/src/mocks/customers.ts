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

export function replaceMockCustomer(
  customerId: number,
  customerData: Omit<Customer, "id">,
): Customer | null {
  const customer = customers.find((customer) => customer.id === customerId);

  if (!customer) {
    return null;
  }

  Object.assign(customer, {
    ...customerData,
    last_name: customerData.last_name.trim(),
    first_name: customerData.first_name.trim(),
    patronymic: customerData.patronymic.trim(),
    email: customerData.email.trim().toLowerCase(),
    birthday: customerData.birthday.trim(),
    phone: customerData.phone.trim(),
    address: customerData.address.trim(),
  });

  return customer;
}

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

export function isMockEmailInUse(
  email: string,
  excludeCustomerId?: number,
): boolean {
  const normalizedEmail = email.trim().toLowerCase();

  return customers.some(
    (customer) =>
      customer.id !== excludeCustomerId &&
      customer.email.toLowerCase() === normalizedEmail,
  );
}

export function updateMockCustomerEmail(
  customerId: number,
  email: string,
): Customer | null {
  const customer = customers.find((customer) => customer.id === customerId);

  if (!customer) {
    return null;
  }

  customer.email = email.trim().toLowerCase();

  return customer;
}

export function isMockPhoneInUse(
  phone: string,
  excludeCustomerId?: number,
): boolean {
  const normalizedPhone = phone.trim();

  return customers.some(
    (customer) =>
      customer.id !== excludeCustomerId && customer.phone === normalizedPhone,
  );
}

export function updateMockCustomerPhone(
  customerId: number,
  phone: string,
): Customer | null {
  const customer = customers.find((customer) => customer.id === customerId);

  if (!customer) {
    return null;
  }

  customer.phone = phone.trim();

  return customer;
}
