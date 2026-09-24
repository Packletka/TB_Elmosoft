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
