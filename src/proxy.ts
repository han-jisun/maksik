import { NextResponse } from "next/server";

/**
 * 관리자 영역 접근 처리.
 * TODO: 추후 비밀번호 로그인을 다시 켤 때 세션 쿠키 검사를 복원합니다.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
