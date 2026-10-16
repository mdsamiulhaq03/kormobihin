import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, RateLimitError, ValidationError } from "@/lib/errors";

/** Every API response has this shape, so the frontend handles all routes the same way. */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function fail(status: number, error: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error, fieldErrors }, { status });
}

/** Parses data with a Zod schema, throwing a ValidationError with per-field messages. */
export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    throw new ValidationError(undefined, fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

/** Reads a JSON body; a malformed body becomes a 400 instead of a crash. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}

/** Prisma error P2002: a unique constraint failed (e.g. two sign-ups with one email at once). */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

/**
 * Wraps a route handler: known AppErrors become clean JSON errors, anything
 * unexpected is logged on the server and returned as a generic 500 (no stack traces).
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof RateLimitError) {
        const response = fail(error.status, error.message);
        response.headers.set("Retry-After", String(error.retryAfterSeconds));
        return response;
      }
      if (error instanceof AppError) {
        return fail(error.status, error.message, error.fieldErrors);
      }
      if (isUniqueConstraintError(error)) {
        return fail(409, "This record already exists.");
      }
      console.error("Unhandled API error:", error);
      return fail(500, "Something went wrong on our side. Please try again.");
    }
  };
}
