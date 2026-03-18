import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";
import { AppError } from "../middleware/errorHandler";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function createToken(userId: string): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new AppError(500, "JWT secret not configured");
  const expiresIn = process.env["JWT_EXPIRES_IN"] ?? "7d";
  return jwt.sign({ userId }, secret, { expiresIn });
}

function setCookieToken(res: import("express").Response, token: string): void {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /auth/signup
router.post("/signup", authRateLimit, async (req, res, next) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = createToken(user.id);
    setCookieToken(res, token);

    const response: ApiResponse<typeof user> = { success: true, data: user };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
    }

    const token = createToken(user.id);
    setCookieToken(res, token);

    const safeUser = { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
    const response: ApiResponse<typeof safeUser> = { success: true, data: safeUser };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  const response: ApiResponse = { success: true, message: "Logged out" };
  res.json(response);
});

// GET /auth/me
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const response: ApiResponse<typeof user> = { success: true, data: user };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
