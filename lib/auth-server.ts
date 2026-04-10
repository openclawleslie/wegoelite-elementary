/**
 * Edge-compatible HMAC-SHA256 token utilities for cookie-based auth.
 * Uses Web Crypto API only — no Node.js crypto dependency.
 */

import { NextRequest } from "next/server";
import type { UserRole } from "./types";

export interface TokenPayload {
  role: UserRole;
  iat: number;
}

const COOKIE_NAME = "wg_session";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

let _keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (!_keyPromise) {
    const secret = getSecret();
    _keyPromise = crypto.subtle.importKey(
      "raw",
      secret.buffer as ArrayBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return _keyPromise;
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const key = await getKey();
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const payloadB64 = base64url(payloadBytes.buffer as ArrayBuffer);

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    payloadBytes.buffer as ArrayBuffer,
  );
  const sigB64 = base64url(sig);

  return `${payloadB64}.${sigB64}`;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const payloadBytes = base64urlDecode(payloadB64);
    const sigBytes = base64urlDecode(sigB64);

    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      payloadBytes.buffer as ArrayBuffer,
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes),
    ) as TokenPayload;

    // Check expiry
    const age = Math.floor(Date.now() / 1000) - payload.iat;
    if (age > TOKEN_MAX_AGE) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract the authenticated user's role from the request cookie.
 * Shared helper for API routes — avoids duplicating cookie+verify logic.
 */
export async function getRoleFromRequest(
  request: NextRequest,
): Promise<UserRole | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.role ?? null;
}

export { COOKIE_NAME, COOKIE_OPTIONS, TOKEN_MAX_AGE };
