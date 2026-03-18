import rateLimit from "express-rate-limit";
import type { ApiResponse } from "@essay-app/types";

const windowMs = parseInt(process.env["RATE_LIMIT_WINDOW_MS"] ?? "900000", 10);
const max = parseInt(process.env["RATE_LIMIT_MAX"] ?? "100", 10);

export const apiRateLimit = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const response: ApiResponse = {
      success: false,
      error: "Too many requests, please try again later.",
    };
    res.status(429).json(response);
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const response: ApiResponse = {
      success: false,
      error: "Too many authentication attempts, please try again later.",
    };
    res.status(429).json(response);
  },
});
