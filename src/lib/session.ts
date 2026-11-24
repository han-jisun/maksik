import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * 관리자 세션 토큰 (만료시각.서명) 생성/검증.
 * proxy.ts 와 Route Handler 양쪽에서 쓰기 위해 next/headers 에 의존하지 않습니다.
 */
export const SESSION_COOKIE = "maksik_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function createSessionToken(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const expires = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${expires}.${sign(expires, secret)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return false;

  const [expires, signature, ...rest] = token.split(".");
  if (!expires || !signature || rest.length > 0) return false;
  if (!safeEqual(signature, sign(expires, secret))) return false;

  const expiresAt = Number(expires);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function checkAdminPassword(input: unknown): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || typeof input !== "string") return false;
  return safeEqual(input, password);
}
