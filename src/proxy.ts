import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * 관리자 영역 외부 접근 차단.
 * 로그인하지 않은 요청은 페이지면 로그인 화면으로, API 면 401 로 돌려보냅니다.
 * (API Route Handler 에서도 한 번 더 검사합니다.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname === "/admin/login") {
    return loggedIn
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  if (loggedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
