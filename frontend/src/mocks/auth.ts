const MOCK_AUTH_KEY = "mock-authenticated";

export const MOCK_CURRENT_CUSTOMER_ID = 6;

export function isMockAuthenticated(): boolean {
  return sessionStorage.getItem(MOCK_AUTH_KEY) === "true";
}

export function mockAuthenticate(): void {
  sessionStorage.setItem(MOCK_AUTH_KEY, "true");
}

export function clearMockAuthentication(): void {
  sessionStorage.removeItem(MOCK_AUTH_KEY);
}

export function getMockCurrentCustomerId(): number | null {
  if (!isMockAuthenticated()) {
    return null;
  }

  return MOCK_CURRENT_CUSTOMER_ID;
}

export function getSafeReturnTo(returnTo: string | null): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/organisations";
  }

  return returnTo;
}
