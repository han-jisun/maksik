import { cookies } from "next/headers";
import { isSameOrigin, readJson } from "@/lib/auth";
import {
  checkAdminPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = (await readJson(request)) as { password?: unknown } | null;

  if (!checkAdminPassword(body?.password)) {
    // 무차별 대입을 늦추기 위한 고정 지연
    await new Promise((resolve) => setTimeout(resolve, 800));
    return Response.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  const token = createSessionToken();
  if (!token) {
    return Response.json(
      { error: "서버에 SESSION_SECRET 이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return Response.json({ ok: true });
}
