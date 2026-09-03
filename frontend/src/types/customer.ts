export type CustomerSex = "M" | "F";

export interface Customer {
  id: number;
  last_name: string;
  first_name: string;
  patronymic: string;
  email: string;
  sex: CustomerSex;
  birthday: string;
  phone: string;
  address: string;
}
