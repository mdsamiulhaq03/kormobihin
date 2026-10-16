// Browser-side helper for calling our own API routes. Unwraps the
// { success, data, error } envelope and turns failures into ApiClientError.

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: body && !isFormData ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError("Can't reach the server. Check your internet connection.", 0);
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    // Non-JSON response (e.g. a platform error page) — handled below.
  }

  if (!payload) {
    throw new ApiClientError("Unexpected response from the server.", response.status);
  }
  if (!payload.success) {
    throw new ApiClientError(payload.error, response.status, payload.fieldErrors);
  }
  return payload.data;
}

/** Only allow same-site relative paths after login, to prevent open-redirect attacks. */
export function safeRedirectPath(path: string | null | undefined, fallback = "/dashboard"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}
