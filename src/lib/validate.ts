import { DIFFICULTIES, isCategoryId } from "./categories";
import type {
  CoupangProduct,
  Difficulty,
  Ingredient,
  RecipeInput,
  RecipeStep,
} from "./types";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function str(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** http(s) 또는 사이트 내부 경로만 허용 (javascript: 등 차단) */
function url(value: unknown): string {
  const s = str(value, 1000);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const parsed = new URL(s);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : "";
  } catch {
    return "";
  }
}

function int(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= min && rounded <= max ? rounded : null;
}

function list(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );
}

export function parseRecipeInput(body: unknown): Result<RecipeInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  const b = body as Record<string, unknown>;

  const title = str(b.title, 100);
  if (!title) return { ok: false, error: "제목을 입력해 주세요." };

  if (!isCategoryId(b.category)) {
    return { ok: false, error: "카테고리를 선택해 주세요." };
  }

  const cookTimeMinutes = int(b.cookTimeMinutes, 1, 24 * 60);
  if (cookTimeMinutes === null) {
    return { ok: false, error: "조리 시간을 1분 이상으로 입력해 주세요." };
  }

  const servings = int(b.servings, 1, 100);
  if (servings === null) {
    return { ok: false, error: "인분 수를 1 이상으로 입력해 주세요." };
  }

  const difficulty = DIFFICULTIES.includes(b.difficulty as Difficulty)
    ? (b.difficulty as Difficulty)
    : "쉬움";

  const ingredients: Ingredient[] = list(b.ingredients)
    .map((i) => ({ name: str(i.name, 100), amount: str(i.amount, 100) }))
    .filter((i) => i.name);

  const steps: RecipeStep[] = list(b.steps)
    .map((s) => ({
      imageUrl: url(s.imageUrl),
      description: str(s.description),
      tip: str(s.tip, 500),
    }))
    .filter((s) => s.description)
    .map((s, index) => ({ stepNumber: index + 1, ...s }));

  if (steps.length === 0) {
    return { ok: false, error: "조리 과정을 한 단계 이상 입력해 주세요." };
  }

  const coupangProducts: CoupangProduct[] = list(b.coupangProducts)
    .map((p) => ({
      name: str(p.name, 100),
      url: url(p.url),
      imageUrl: url(p.imageUrl),
    }))
    .filter((p) => p.name && /^https?:\/\//.test(p.url));

  return {
    ok: true,
    value: {
      title,
      description: str(b.description, 500),
      category: b.category,
      thumbnailUrl: url(b.thumbnailUrl),
      cookTimeMinutes,
      difficulty,
      servings,
      ingredients,
      steps,
      coupangProducts,
      published: b.published === true,
      recommended: b.recommended === true,
    },
  };
}
