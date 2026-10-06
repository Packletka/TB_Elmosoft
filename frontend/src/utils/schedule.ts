import { timeToMinutes } from "./talonAvailability";
import type { Weekday } from "../types/api/common";
import type { DoctorWorkSchedule } from "../types/api/doctor";

const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/**
 * Keeps only real weekdays that have a non-empty range. Days stored as
 * "00:00"-"00:00" and stray keys (like a misspelled "tueday") disappear, so
 * the editor shows them as days off.
 */
export function normalizeSchedule(
  schedule: DoctorWorkSchedule,
): DoctorWorkSchedule {
  const normalized: DoctorWorkSchedule = {};

  for (const day of WEEKDAYS) {
    const range = schedule[day];

    if (range && timeToMinutes(range.start) < timeToMinutes(range.finish)) {
      normalized[day] = range;
    }
  }

  return normalized;
}
