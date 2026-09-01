import type { Talon } from "../types/appointment";

export const talons: Talon[] = [
  // Doctor 1 — several free talons across several days
  {
    id: 1,
    doctor: 1,
    customer: null,
    date: "2026-09-02",
    time: "09:00",
  },
  {
    id: 2,
    doctor: 1,
    customer: null,
    date: "2026-09-02",
    time: "09:30",
  },
  {
    id: 3,
    doctor: 1,
    customer: 1,
    date: "2026-09-02",
    time: "10:00",
  },
  {
    id: 4,
    doctor: 1,
    customer: null,
    date: "2026-09-04",
    time: "11:00",
  },
  {
    id: 5,
    doctor: 1,
    customer: null,
    date: "2026-09-04",
    time: "11:30",
  },

  // Doctor 2 — one available day
  {
    id: 6,
    doctor: 2,
    customer: null,
    date: "2026-09-03",
    time: "13:00",
  },
  {
    id: 7,
    doctor: 2,
    customer: null,
    date: "2026-09-03",
    time: "13:30",
  },

  // Doctor 3 — one fully booked day + one available day
  {
    id: 8,
    doctor: 3,
    customer: 2,
    date: "2026-09-02",
    time: "10:00",
  },
  {
    id: 9,
    doctor: 3,
    customer: 3,
    date: "2026-09-02",
    time: "10:30",
  },
  {
    id: 10,
    doctor: 3,
    customer: null,
    date: "2026-09-05",
    time: "12:00",
  },

  // Doctor 4 — several available times on the same date
  {
    id: 11,
    doctor: 4,
    customer: null,
    date: "2026-09-06",
    time: "08:00",
  },
  {
    id: 12,
    doctor: 4,
    customer: null,
    date: "2026-09-06",
    time: "08:30",
  },
  {
    id: 13,
    doctor: 4,
    customer: null,
    date: "2026-09-06",
    time: "09:00",
  },

  // Doctor 5 — mix of free and booked talons
  {
    id: 14,
    doctor: 5,
    customer: 4,
    date: "2026-09-07",
    time: "14:00",
  },
  {
    id: 15,
    doctor: 5,
    customer: null,
    date: "2026-09-07",
    time: "14:30",
  },

  // Doctor 6 — useful for our Ophthalmologist testing
  {
    id: 16,
    doctor: 6,
    customer: null,
    date: "2026-09-03",
    time: "09:00",
  },
  {
    id: 17,
    doctor: 6,
    customer: null,
    date: "2026-09-03",
    time: "09:30",
  },
  {
    id: 18,
    doctor: 6,
    customer: 5,
    date: "2026-09-03",
    time: "10:00",
  },
  {
    id: 19,
    doctor: 6,
    customer: null,
    date: "2026-09-05",
    time: "14:30",
  },
  {
    id: 20,
    doctor: 6,
    customer: null,
    date: "2026-09-05",
    time: "15:00",
  },

  // Doctor 7 — only one free talon
  {
    id: 21,
    doctor: 7,
    customer: null,
    date: "2026-09-08",
    time: "16:00",
  },

  // Doctor 8 — has talons, but ALL are already booked
  {
    id: 22,
    doctor: 8,
    customer: 2,
    date: "2026-09-04",
    time: "10:00",
  },
  {
    id: 23,
    doctor: 8,
    customer: 3,
    date: "2026-09-04",
    time: "10:30",
  },

  // Doctor 9 — appointments available on two different dates
  {
    id: 24,
    doctor: 9,
    customer: null,
    date: "2026-09-09",
    time: "12:00",
  },
  {
    id: 25,
    doctor: 9,
    customer: null,
    date: "2026-09-11",
    time: "12:30",
  },
];
