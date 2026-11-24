import { cookies } from "next/headers";
import { isSameOrigin } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
