import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import type { CategoryId, Recipe, RecipeInput } from "./types";

/**
 * 레시피 저장소.
 *
 * DB가 아직 확정되지 않아 `data/recipes.json` 파일을 저장소로 사용합니다.
 * Supabase 등으로 옮길 때는 이 파일의 read/write 함수만 교체하면 됩니다.
 * (파일 쓰기는 Vercel 같은 서버리스 환경에서는 동작하지 않습니다.)
 */
const DATA_FILE = path.join(process.cwd(), "data", "recipes.json");

export const RECIPES_TAG = "recipes";

// ---------- 저수준 읽기/쓰기 ----------

/** 캐시를 거치지 않는 전체 조회 (관리자용, 비공개 포함) */
export async function readAllRecipes(): Promise<Recipe[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAllRecipes(recipes: Recipe[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(recipes, null, 2)}\n`, "utf-8");
  await fs.rename(tmp, DATA_FILE);
}

// 동시에 들어온 쓰기 요청이 서로 덮어쓰지 않도록 순서대로 처리합니다.
let writeQueue: Promise<unknown> = Promise.resolve();

function mutate<T>(
  fn: (recipes: Recipe[]) => { next: Recipe[]; result: T },
): Promise<T> {
  const run = writeQueue.then(async () => {
    const { next, result } = fn(await readAllRecipes());
    await writeAllRecipes(next);
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

function byNewest(a: Recipe, b: Recipe): number {
  return b.createdAt.localeCompare(a.createdAt);
}

// ---------- 프론트용 조회 (캐시됨) ----------

export async function getPublishedRecipes(): Promise<Recipe[]> {
  "use cache";
  cacheTag(RECIPES_TAG);
  cacheLife("hours");

  const all = await readAllRecipes();
  return all.filter((r) => r.published).sort(byNewest);
}

export async function getPublishedRecipe(id: string): Promise<Recipe | null> {
  "use cache";
  cacheTag(RECIPES_TAG);
  cacheLife("hours");

  const all = await readAllRecipes();
  return all.find((r) => r.id === id && r.published) ?? null;
}

/** 제목 · 설명 · 재료명 기준 검색 */
export async function searchRecipes(
  query: string,
  category?: CategoryId,
): Promise<Recipe[]> {
  const recipes = await getPublishedRecipes();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return recipes.filter((recipe) => {
    if (category && recipe.category !== category) return false;
    if (terms.length === 0) return true;

    const haystack = [
      recipe.title,
      recipe.description,
      ...recipe.ingredients.map((i) => i.name),
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

// ---------- 관리자용 변경 ----------

export async function getRecipeForAdmin(id: string): Promise<Recipe | null> {
  const all = await readAllRecipes();
  return all.find((r) => r.id === id) ?? null;
}

export function createRecipe(input: RecipeInput): Promise<Recipe> {
  return mutate((recipes) => {
    let id = randomUUID().slice(0, 8);
    while (recipes.some((r) => r.id === id)) id = randomUUID().slice(0, 8);

    const now = new Date().toISOString();
    const recipe: Recipe = { ...input, id, createdAt: now, updatedAt: now };
    return { next: [...recipes, recipe], result: recipe };
  });
}

export function updateRecipe(
  id: string,
  patch: Partial<RecipeInput>,
): Promise<Recipe | null> {
  return mutate((recipes) => {
    const current = recipes.find((r) => r.id === id);
    if (!current) return { next: recipes, result: null };

    const updated: Recipe = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    return {
      next: recipes.map((r) => (r.id === id ? updated : r)),
      result: updated,
    };
  });
}

export function deleteRecipe(id: string): Promise<boolean> {
  return mutate((recipes) => {
    const next = recipes.filter((r) => r.id !== id);
    return { next, result: next.length !== recipes.length };
  });
}
