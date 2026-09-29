import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import type { DoctorWorkSchedule } from "../types/api/doctor";
import type { OrganisationSchedule } from "../types/api/healthOrganisation";
import type { TalonResponse } from "../types/api/appointment";
import type { Weekday } from "../types/api/common";

/**
 * Mirrors backend/appointments/utils.py's validate_appointment(). Any future
 * change to that function's Checks 1-5 must be reflected here too, or the
 * create-talon dialog will offer times the backend then rejects.
 */

// dayjs's Dayjs.day() returns 0 for Sunday through 6 for Saturday. Indexing
// this array with that same number gives the matching weekday key.
const DAYJS_WEEKDAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Check 2's global window: 07:00-20:00 ("Belarus rule" per the backend comment).
const GLOBAL_OPEN_MINUTES = 7 * 60;
const GLOBAL_CLOSE_MINUTES = 20 * 60;

// A day the doctor doesn't work at all (missing from work_schedule) behaves
// identically to one explicitly stored as "00:00"-"00:00" - see the note
// below where this is used.
const ZERO_LENGTH_WINDOW = { start: "00:00", finish: "00:00" };

/** Accepts "HH:MM" or "HH:MM:SS" - schedules use the former, the API returns the latter. */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export interface TalonAvailabilityContext {
  workSchedule: DoctorWorkSchedule;
  slotDuration: number;
  organisationSchedule: OrganisationSchedule;
  existingTalons: TalonResponse[];
  /** Defaults to the real current moment; pass a fixed value to test this deterministically. */
  now?: Dayjs;
}

/**
 * Every start time a doctor could create a new talon at on `date`, given
 * their own schedule, their organisation's schedule, and their existing
 * talons that day. Mirrors validate_appointment() exactly - see the Check N
 * comments below for which backend rule each piece corresponds to.
 */
export function getAvailableStartTimes(
  date: Dayjs,
  {
    workSchedule,
    slotDuration,
    organisationSchedule,
    existingTalons,
    now = dayjs(),
  }: TalonAvailabilityContext,
): string[] {
  if (slotDuration <= 0) {
    return [];
  }

  // Frontend-only guard: validate_appointment never rejects a past date or
  // time on its own, so nothing on the backend stops this if we don't
  // check it here.
  if (date.isBefore(now, "day")) {
    return [];
  }

  const dayName = DAYJS_WEEKDAY_ORDER[date.day()];

  // A missing key (doctor doesn't work this day) and an explicit
  // "00:00"-"00:00" entry both collapse to the same zero-length window
  // below, and both end up producing zero available times through the
  // effective-window arithmetic - so there's no need to special-case
  // "doctor is off" separately from "doctor's hours happen to be zero".
  const doctorDay = workSchedule[dayName] ?? ZERO_LENGTH_WINDOW;
  const orgDay = organisationSchedule[dayName];

  const doctorStart = timeToMinutes(doctorDay.start);
  const doctorEnd = timeToMinutes(doctorDay.finish);
  const orgStart = timeToMinutes(orgDay.open);
  const orgEnd = timeToMinutes(orgDay.close);

  // Check 3: effective working window (doctor and organisation).
  const effectiveStart = Math.max(orgStart, doctorStart);
  const effectiveEnd = Math.min(orgEnd, doctorEnd);

  const dateString = date.format("YYYY-MM-DD");
  const isToday = date.isSame(now, "day");
  const nowMinutes = now.hour() * 60 + now.minute();

  // Check 5's data: this doctor's other talons on this exact date. The
  // backend computes each one's occupied span using the doctor's CURRENT
  // slot_duration, not whatever duration was true when it was created -
  // we do the same here, matching the "slot_duration is frozen by
  // convention" decision.
  const occupiedSpans = existingTalons
    .filter((talon) => talon.date === dateString)
    .map((talon) => {
      const start = timeToMinutes(talon.time);
      return { start, end: start + slotDuration };
    });

  const availableTimes: string[] = [];

  // Stepping directly from effectiveStart by slotDuration only ever visits
  // already-aligned times (Check 4), so - unlike the old doctor-start-
  // anchored version - there's no separate "generate everything, then
  // filter by alignment" pass needed. The grid itself is the anchor.
  for (
    let candidate = effectiveStart;
    candidate + slotDuration <= effectiveEnd;
    candidate += slotDuration
  ) {
    // Check 2: global 07:00-20:00 window - only the start time is checked.
    if (candidate < GLOBAL_OPEN_MINUTES || candidate > GLOBAL_CLOSE_MINUTES) {
      continue;
    }

    if (isToday && candidate <= nowMinutes) {
      continue;
    }

    // Check 5: overlap with an existing talon on this date.
    const candidateEnd = candidate + slotDuration;
    const overlaps = occupiedSpans.some(
      (span) => candidate < span.end && candidateEnd > span.start,
    );
    if (overlaps) {
      continue;
    }

    availableTimes.push(minutesToTime(candidate));
  }

  return availableTimes;
}

/** Whether `date` has any available start time at all - used to grey out the calendar. */
export function hasAvailability(
  date: Dayjs,
  context: TalonAvailabilityContext,
): boolean {
  return getAvailableStartTimes(date, context).length > 0;
}
