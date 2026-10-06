export function getSafeReturnTo(rawReturnTo: string | null): string {
  if (!rawReturnTo) return "/";
  if (!rawReturnTo.startsWith("/") || rawReturnTo.startsWith("//")) return "/";
  return rawReturnTo;
}
