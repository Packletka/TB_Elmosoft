const positionPlurals: Record<string, string> = {
  Therapist: "Therapists",
  Cardiologist: "Cardiologists",
  Neurologist: "Neurologists",
  Surgeon: "Surgeons",
  Ophthalmologist: "Ophthalmologists",
};

export function getPluralPosition(position: string): string {
  return positionPlurals[position] ?? `${position}s`;
}
