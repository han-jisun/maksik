import { DIFFICULTIES, isCategoryId } from "./categories";
import type { ParsedNaverPost } from "./naver-blog";
import type { CategoryId, Difficulty, Ingredient } from "./types";

export interface ImportedStep {
  imageUrl: string;
  description: string;
  tip: string;
}

export interface ImportedRecipeDraft {
  title: string;
  description: string;
  categories: CategoryId[];
  thumbnailUrl: string;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: Ingredient[];
  steps: ImportedStep[];
  /** AI 정리가 적용되었는지 여부 (키 미설정/오류 시 기본 추출 폴백) */
  usedAi: boolean;
  aiWarning?: string;
}

function buildEndpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

/** AI 없이도 블로그 이미지와 바로 아래/위 텍스트를 카드별로 묶는 기본 폴백 */
function buildFallbackDraft(
  post: ParsedNaverPost,
  warning?: string,
): ImportedRecipeDraft {
  const steps: ImportedStep[] = [];

  if (post.images.length > 0) {
    // 각 이미지 뒤에 이어지는 텍스트들을 해당 카드의 설명으로 묶습니다.
    const textByImage = new Map<number, string[]>();
    let currentImg = -1;
    const leadingTexts: string[] = [];

    for (const block of post.blocks) {
      if (block.type === "image" && block.imageIndex !== undefined) {
        currentImg = block.imageIndex;
        if (!textByImage.has(currentImg)) textByImage.set(currentImg, []);
      } else if (block.type === "text" && block.text) {
        if (currentImg === -1) {
          leadingTexts.push(block.text);
        } else {
          textByImage.get(currentImg)?.push(block.text);
        }
      }
    }

    for (let i = 0; i < post.images.length; i++) {
      const lines = textByImage.get(i) ?? [];
      steps.push({
        imageUrl: post.images[i],
        description: lines.join("\n").slice(0, 600),
        tip: "",
      });
    }

    return {
      title: post.title || "새 레시피",
      description: leadingTexts.slice(0, 2).join(" ").slice(0, 200),
      categories: ["simple"],
      thumbnailUrl: post.images[post.images.length - 1] ?? post.images[0] ?? "",
      cookTimeMinutes: 15,
      difficulty: "쉬움",
      servings: 2,
      ingredients: [],
      steps,
      usedAi: false,
      aiWarning: warning,
    };
  }

  const allText = post.blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text as string);

  return {
    title: post.title || "새 레시피",
    description: allText[0]?.slice(0, 200) ?? "",
    categories: ["simple"],
    thumbnailUrl: "",
    cookTimeMinutes: 15,
    difficulty: "쉬움",
    servings: 2,
    ingredients: [],
    steps: allText.slice(0, 12).map((text) => ({
      imageUrl: "",
      description: text.slice(0, 600),
      tip: "",
    })),
    usedAi: false,
    aiWarning: warning,
  };
}

function formatBlocksForPrompt(post: ParsedNaverPost): string {
  const lines: string[] = [];
  if (post.title) {
    lines.push(`[제목] ${post.title}`);
  }
  lines.push(`[총 이미지 수] ${post.images.length}장 (인덱스 0 ~ ${Math.max(0, post.images.length - 1)})`);
  lines.push("");

  for (const block of post.blocks) {
    if (block.type === "image" && block.imageIndex !== undefined) {
      lines.push(`[IMAGE_${block.imageIndex}]`);
    } else if (block.type === "text" && block.text) {
      lines.push(block.text);
    }
  }
  // 너무 긴 글은 프롬프트 상한 내로 자릅니다.
  return lines.join("\n").slice(0, 18000);
}

interface AiJsonResponse {
  title?: unknown;
  description?: unknown;
  categories?: unknown;
  thumbnailIndex?: unknown;
  cookTimeMinutes?: unknown;
  difficulty?: unknown;
  servings?: unknown;
  ingredients?: unknown;
  cards?: unknown;
}

function parseJsonFromAiText(raw: string): AiJsonResponse | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as AiJsonResponse;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as AiJsonResponse;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Gemini API 를 호출해 네이버 블로그 본문·이미지 순서를 레시피 초안으로 구조화합니다.
 */
export async function structureRecipeWithGemini(
  post: ParsedNaverPost,
): Promise<ImportedRecipeDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return buildFallbackDraft(post, "GEMINI_API_KEY가 설정되지 않아 기본 추출로 가져왔습니다.");
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  const endpoint = buildEndpoint(model);

  const systemPrompt = [
    "당신은 한국어 요리책 편집자입니다.",
    "사용자가 작성한 네이버 블로그 요리 글을 읽고, 모바일 레시피 카드 앱에 바로 등록할 수 있는 순수 JSON 객체만 반환하세요.",
    "",
    "반드시 아래 JSON 스키마를 지키세요:",
    "{",
    '  "title": "깔끔한 요리 제목 (블로그 잡담/해시태그 제거, 40자 이내)",',
    '  "description": "요리 한 줄 소개 (1~2문장, 자연스러운 한국어)",',
    '  "categories": ["simple" | "special" | "seasonal" 중 해당하는 것 1개 이상],',
    '  "thumbnailIndex": 대표 완성 요리 사진의 이미지 번호(0 이상 정수, 이미지가 없으면 null),',
    '  "cookTimeMinutes": 예상 조리 시간(분, 정수),',
    '  "difficulty": "쉬움" | "보통" | "어려움",',
    '  "servings": 인분(정수),',
    '  "ingredients": [{ "name": "재료명", "amount": "수량(예: 2개, 1큰술)", "required": true(필수 재료) | false(선택·고명 재료) }],',
    '  "cards": [{ "imageIndex": 이미지 번호(정수 또는 null), "description": "해당 카드의 간결하고 명확한 조리 설명", "tip": "요리 팁(없으면 빈 문자열)" }]',
    "}",
    "",
    "중요 규칙:",
    "1. 본문에 있는 모든 이미지([IMAGE_0] ~ [IMAGE_N])를 최대한 빠짐없이 순서대로 각각 하나의 카드로 만들어 주세요. (한 카드에 이미지 1장)",
    "2. 각 이미지 바로 위·아래의 블로그 설명을 참고해 해당 카드의 description 을 읽기 쉬운 레시피 문장(합니다체)으로 다듬어 주세요.",
    "3. 인사말, 광고 문구, 해시태그, 이모티콘 남발은 정리하되 요리 정보와 팁은 빠뜨리지 마세요.",
    "4. ingredients 에서 요리에 꼭 들어가야 하는 핵심·필수 재료는 required: true, 없어도 되거나 취향·고명(깨, 파슬리 등)에 해당하는 선택 재료는 required: false 로 구분해 주세요.",
    "5. categories 규칙: simple=간단요리, special=특별요리, seasonal=제철요리 (중복 선택 가능).",
    "6. JSON 외의 마크다운 설명이나 여분 텍스트는 절대 출력하지 마세요.",
  ].join("\n");

  const userContent = formatBlocksForPrompt(post);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n---\n${userContent}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[gemini-recipe] HTTP error:", response.status, errText.slice(0, 300));
      return buildFallbackDraft(
        post,
        `AI 정리 호출에 실패해(HTTP ${response.status}) 이미지와 원문으로 기본 추출했습니다.`,
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
    };

    const rawText =
      data.candidates?.[0]?.content?.parts
        ?.filter((p) => !p.thought)
        .map((p) => p.text ?? "")
        .join("") ?? "";

    const parsed = parseJsonFromAiText(rawText);
    if (!parsed) {
      return buildFallbackDraft(
        post,
        "AI 응답을 해석하지 못해 이미지와 원문으로 기본 추출했습니다.",
      );
    }

    const categories = Array.isArray(parsed.categories)
      ? Array.from(new Set(parsed.categories.filter(isCategoryId)))
      : [];

    const ingredients: Ingredient[] = Array.isArray(parsed.ingredients)
      ? parsed.ingredients
          .filter(
            (i): i is Record<string, unknown> =>
              typeof i === "object" && i !== null,
          )
          .map((i) => ({
            name: typeof i.name === "string" ? i.name.trim().slice(0, 100) : "",
            amount:
              typeof i.amount === "string" ? i.amount.trim().slice(0, 100) : "",
            required: i.required === true,
          }))
          .filter((i) => i.name)
      : [];

    const usedImageIndices = new Set<number>();
    const steps: ImportedStep[] = [];

    if (Array.isArray(parsed.cards)) {
      for (const item of parsed.cards) {
        if (typeof item !== "object" || item === null) continue;
        const c = item as Record<string, unknown>;
        const idx =
          typeof c.imageIndex === "number" &&
          Number.isInteger(c.imageIndex) &&
          c.imageIndex >= 0 &&
          c.imageIndex < post.images.length
            ? c.imageIndex
            : null;
        if (idx !== null) usedImageIndices.add(idx);

        const imageUrl = idx !== null ? post.images[idx] : "";
        const description =
          typeof c.description === "string" ? c.description.trim() : "";
        const tip = typeof c.tip === "string" ? c.tip.trim() : "";

        if (imageUrl || description) {
          steps.push({ imageUrl, description, tip });
        }
      }
    }

    // AI 가 누락한 본문 이미지가 있다면 뒤에 빠짐없이 추가해 줍니다.
    for (let i = 0; i < post.images.length; i++) {
      if (!usedImageIndices.has(i)) {
        steps.push({
          imageUrl: post.images[i],
          description: "",
          tip: "",
        });
      }
    }

    const cookTime =
      typeof parsed.cookTimeMinutes === "number" &&
      Number.isFinite(parsed.cookTimeMinutes) &&
      parsed.cookTimeMinutes >= 1
        ? Math.min(1440, Math.round(parsed.cookTimeMinutes))
        : 15;

    const servings =
      typeof parsed.servings === "number" &&
      Number.isFinite(parsed.servings) &&
      parsed.servings >= 1
        ? Math.min(100, Math.round(parsed.servings))
        : 2;

    const difficulty: Difficulty = DIFFICULTIES.includes(
      parsed.difficulty as Difficulty,
    )
      ? (parsed.difficulty as Difficulty)
      : "쉬움";

    // 가장 마지막 사진을 대표 썸네일로 사용합니다 (요리 완성 사진 기준).
    const lastImageUrl =
      [...steps].reverse().find((s) => s.imageUrl)?.imageUrl ??
      post.images[post.images.length - 1] ??
      "";

    return {
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim().slice(0, 100)
          : post.title || "새 레시피",
      description:
        typeof parsed.description === "string"
          ? parsed.description.trim().slice(0, 500)
          : "",
      categories: categories.length > 0 ? categories : ["simple"],
      thumbnailUrl: lastImageUrl,
      cookTimeMinutes: cookTime,
      difficulty,
      servings,
      ingredients,
      steps,
      usedAi: true,
    };
  } catch (error) {
    console.error("[gemini-recipe] Error:", error);
    return buildFallbackDraft(
      post,
      "AI 서버 응답 시간이 초과되었거나 오류가 발생해 기본 추출로 가져왔습니다.",
    );
  }
}
