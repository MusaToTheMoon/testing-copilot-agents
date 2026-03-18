"use server";

import { cookies } from "next/headers";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
}

export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token");
  if (!token) return null;

  try {
    const res = await fetch(`${process.env["API_URL"] ?? "http://localhost:3001"}/api/auth/me`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { success: boolean; data?: AuthUser };
    return data.success ? (data.data ?? null) : null;
  } catch {
    return null;
  }
}
