import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { ApiResponse } from "@essay-app/types";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token =
    (req.cookies as Record<string, string | undefined>)["auth_token"] ??
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    const response: ApiResponse = { success: false, error: "Authentication required" };
    res.status(401).json(response);
    return;
  }

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    const response: ApiResponse = { success: false, error: "Server configuration error" };
    res.status(500).json(response);
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch {
    const response: ApiResponse = { success: false, error: "Invalid or expired token" };
    res.status(401).json(response);
  }
}
