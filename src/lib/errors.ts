/**
 * Errors that are safe to show to the user. Route handlers turn these into JSON
 * responses with the right HTTP status; any other error becomes a generic 500.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Please check the highlighted fields.",
    fieldErrors?: Record<string, string[]>,
  ) {
    super(400, message, fieldErrors);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Please log in to continue.") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(
      404,
      `This ${resource === "CV" ? "CV" : resource.toLowerCase()} doesn't exist or was deleted.`,
    );
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterSeconds: number) {
    super(429, `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`);
    this.name = "RateLimitError";
  }
}
