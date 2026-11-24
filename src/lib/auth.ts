import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Route Handler 안에서 관리자 세션 여부를 확인합니다. */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/** 다른 사이트에서 보낸 요청(CSRF)을 거릅니다. 브라우저는 변경 요청에 Origin 을 항상 붙입니다. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** 관리자 API 공통 검사. 통과하면 null, 아니면 응답을 돌려줍니다. */
export async function guardAdmin(request: Request): Promise<Response | null> {
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }
  if (!(await isAdmin())) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
