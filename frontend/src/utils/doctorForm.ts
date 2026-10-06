import type { DoctorWorkSchedule } from "../types/api/doctor";

export const MAX_POSITION_LENGTH = 150;
export const MIN_CABINET = 1;
export const MAX_CABINET = 9999;
export const MIN_SLOT_MINUTES = 5;
export const MAX_SLOT_MINUTES = 240;

function isWholeNumberInRange(value: string, min: number, max: number) {
  return /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;
}

export function validatePosition(position: string): string | null {
  const trimmed = position.trim();

  if (trimmed === "") {
    return "Position is required.";
  }
  if (trimmed.length > MAX_POSITION_LENGTH) {
    return `Position must be at most ${MAX_POSITION_LENGTH} characters.`;
  }
  return null;
}

export function validateCabinet(cabinet: string): string | null {
  return isWholeNumberInRange(cabinet, MIN_CABINET, MAX_CABINET)
    ? null
    : `Cabinet must be a whole number from ${MIN_CABINET} to ${MAX_CABINET}.`;
}

export function validateSlotDuration(slotDuration: string): string | null {
  return isWholeNumberInRange(slotDuration, MIN_SLOT_MINUTES, MAX_SLOT_MINUTES)
    ? null
    : `Appointment length must be a whole number of minutes from ${MIN_SLOT_MINUTES} to ${MAX_SLOT_MINUTES}.`;
}

export function validateSchedule(schedule: DoctorWorkSchedule): string | null {
  return Object.keys(schedule).length === 0
    ? "Choose at least one working day."
    : null;
}
