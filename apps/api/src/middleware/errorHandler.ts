import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "@essay-app/types";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    const response: ApiResponse = { success: false, error: err.message };
    res.status(err.statusCode).json(response);
    return;
  }

  // ZodError handling
  if (err.name === "ZodError") {
    const response: ApiResponse = { success: false, error: "Validation error", message: err.message };
    res.status(400).json(response);
    return;
  }

  console.error("Unhandled error:", err);
  const response: ApiResponse = { success: false, error: "Internal server error" };
  res.status(500).json(response);
}
