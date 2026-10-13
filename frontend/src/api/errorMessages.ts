import axios from "axios";

export function extractErrorMessages(err: unknown): string[] {
  if (!axios.isAxiosError(err) || !err.response?.data) {
    return ["Something went wrong. Please try again."];
  }

  const data: unknown = err.response.data;

  if (typeof data === "string") {
    return [data];
  }

  if (typeof data === "object" && data !== null) {
    if ("detail" in data && typeof data.detail === "string") {
      return [data.detail];
    }

    const messages = Object.values(data).flatMap((value) =>
      Array.isArray(value)
        ? value.map(String)
        : typeof value === "string"
          ? [value]
          : [],
    );

    if (messages.length > 0) {
      return messages;
    }
  }

  return ["Something went wrong. Please try again."];
}

// The server's own 429 text is technical ("Expected available in 3412 seconds"). Retry-After carries the same wait
// as a number, and CORS_EXPOSE_HEADERS in the backend settings is what lets the browser read it
export function getThrottleMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 429) {
    return null;
  }

  const seconds = Number(err.response.headers["retry-after"]);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Too many attempts. Please try again later.";
  }

  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1
    ? "Too many attempts. Please try again in a minute."
    : `Too many attempts. Please try again in about ${minutes} minutes.`;
}
