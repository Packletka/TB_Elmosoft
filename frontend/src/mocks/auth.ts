const MOCK_AUTH_KEY = "mock-authenticated";

export function isMockAuthenticated(): boolean {
  return sessionStorage.getItem(MOCK_AUTH_KEY) === "true";
}

export function mockAuthenticate(): void {
  sessionStorage.setItem(MOCK_AUTH_KEY, "true");
}

export function clearMockAuthentication(): void {
  sessionStorage.removeItem(MOCK_AUTH_KEY);
}

export function getSafeReturnTo(returnTo: string | null): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/organisations";
  }

  return returnTo;
}
