import { guardAdmin, readJson } from "@/lib/auth";
import { structureRecipeWithGemini } from "@/lib/gemini-recipe";
import { fetchAndParseNaverPost } from "@/lib/naver-blog";

/** 네이버 블로그 공개 글 URL 을 받아 이미지 저장 + Gemini 로 레시피 초안 생성 */
export async function POST(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const body = (await readJson(request)) as { url?: unknown } | null;
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

  if (!rawUrl) {
    return Response.json(
      { error: "네이버 블로그 링크를 입력해 주세요." },
      { status: 400 },
    );
  }

  try {
    const post = await fetchAndParseNaverPost(rawUrl);
    const draft = await structureRecipeWithGemini(post);
    return Response.json({
      draft,
      imageCount: post.images.length,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "블로그 글을 가져오는 중 오류가 발생했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
