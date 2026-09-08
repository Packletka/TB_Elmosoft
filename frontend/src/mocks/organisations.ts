import type { HealthOrganisation } from "../types/healthOrganisation";

export const organisations: HealthOrganisation[] = [
  {
    id: 1,
    name: "Minsk City Polyclinic №1",
    address: "10 Independence Avenue, Minsk",
    general_info: "General outpatient medical services for adults.",
    phone: "+375 17 111-11-11",
    email: "info@polyclinic1.test",
    site: "https://polyclinic1.test",
  },
  {
    id: 2,
    name: "Minsk City Polyclinic №7",
    address: "25 Pobediteley Avenue, Minsk",
    general_info: "Multidisciplinary outpatient medical centre.",
    phone: "+375 17 222-22-22",
    email: "info@polyclinic7.test",
    site: "https://polyclinic7.test",
  },
  {
    id: 3,
    name: "Central District Polyclinic",
    address: "14 Nemiga Street, Minsk",
    general_info: "Primary healthcare and specialist consultations.",
    phone: "+375 17 333-33-33",
    email: "info@centralclinic.test",
    site: "https://centralclinic.test",
  },
  {
    id: 4,
    name: "Minsk Clinical Hospital №3",
    address: "48 Yakub Kolas Street, Minsk",
    general_info:
      "Hospital providing inpatient and outpatient medical services.",
    phone: "+375 17 444-44-44",
    email: "info@hospital3.test",
    site: "https://hospital3.test",
  },
  {
    id: 5,
    name: "Family Health Medical Centre",
    address: "6 Surganova Street, Minsk",
    general_info:
      "Medical centre for family medicine and specialist consultations.",
    phone: "+375 17 555-55-55",
    email: "info@familyhealth.test",
    site: "https://familyhealth.test",
  },
];
