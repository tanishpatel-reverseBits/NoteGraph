import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodType } from "zod";
import type { NextRequest } from "next/server";
import { AppError } from "@/server/errors";

export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown };
};

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

function errResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}

export const badRequest = (message: string, details?: unknown) =>
  errResponse("BAD_REQUEST", message, 400, details);
export const notFound = (message = "Not found") =>
  errResponse("NOT_FOUND", message, 404);
export const conflict = (message: string) =>
  errResponse("CONFLICT", message, 409);

export function parseQuery<T>(request: NextRequest, schema: ZodType<T>): T {
  return schema.parse(Object.fromEntries(request.nextUrl.searchParams));
}

export async function parseBody<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  return schema.parse(await request.json());
}

export function handleUnknown(e: unknown) {
  if (e instanceof AppError) {
    return errResponse(e.code, e.message, e.status, e.details);
  }
  if (e instanceof ZodError) {
    return badRequest("Validation failed", e.flatten());
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return conflict("Unique constraint violation");
    if (e.code === "P2025") return notFound("Record not found");
  }
  console.error(e);
  return errResponse("INTERNAL", "Internal error", 500);
}
