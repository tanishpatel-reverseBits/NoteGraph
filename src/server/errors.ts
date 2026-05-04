export type AppErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

const STATUS: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }

  static notFound(message = "Not found") {
    return new AppError("NOT_FOUND", message);
  }
  static conflict(message: string) {
    return new AppError("CONFLICT", message);
  }
  static badRequest(message: string, details?: unknown) {
    return new AppError("BAD_REQUEST", message, details);
  }
}
