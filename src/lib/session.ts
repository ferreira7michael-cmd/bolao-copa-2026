import crypto from "crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

const COOKIE_NAME = "bolao_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("Configure SESSION_SECRET with at least 24 characters.");
  }

  return secret;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const payload = Buffer.from(JSON.stringify({ user, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSession(): SessionUser | null {
  const token = cookies().get(COOKIE_NAME)?.value;

  if (!token) return null;

  const [payload, signature] = token.split(".");

  if (!payload || !signature || sign(payload) !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      user: SessionUser;
      expiresAt: number;
    };

    if (parsed.expiresAt < Date.now()) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser) {
  cookies().set(COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export function requireSession() {
  const user = readSession();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function requireAdmin() {
  const user = requireSession();
  if (!user.isAdmin) throw new Error("FORBIDDEN");
  return user;
}
