import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { getRecipeCategories } from "./categories";
import type {
  CategoryId,
  CoupangProduct,
  Difficulty,
  Ingredient,
  Recipe,
  RecipeInput,
  RecipeStep,
} from "./types";

export const RECIPES_TAG = "recipes";

const TABLE = "recipes";

interface RecipeRow {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  categories: CategoryId[] | null;
  thumbnail_url: string;
  cook_time_minutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: Ingredient[] | null;
  steps: RecipeStep[] | null;
  coupang_products: CoupangProduct[] | null;
  published: boolean;
  recommended: boolean;
  view_count?: number | null;
  created_at: string;
  updated_at: string;
}

let cachedClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다.",
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

function toRecipe(row: RecipeRow): Recipe {
  const categories =
    Array.isArray(row.categories) && row.categories.length > 0
      ? row.categories
      : [row.category];

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    categories,
    thumbnailUrl: row.thumbnail_url ?? "",
    cookTimeMinutes: row.cook_time_minutes,
    difficulty: row.difficulty,
    servings: row.servings,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    coupangProducts: row.coupang_products ?? [],
    published: row.published,
    recommended: row.recommended,
    viewCount: row.view_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRowPatch(patch: Partial<RecipeInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.categories !== undefined) row.categories = patch.categories;
  if (patch.thumbnailUrl !== undefined) row.thumbnail_url = patch.thumbnailUrl;
  if (patch.cookTimeMinutes !== undefined) {
    row.cook_time_minutes = patch.cookTimeMinutes;
  }
  if (patch.difficulty !== undefined) row.difficulty = patch.difficulty;
  if (patch.servings !== undefined) row.servings = patch.servings;
  if (patch.ingredients !== undefined) row.ingredients = patch.ingredients;
  if (patch.steps !== undefined) row.steps = patch.steps;
  if (patch.coupangProducts !== undefined) {
    row.coupang_products = patch.coupangProducts;
  }
  if (patch.published !== undefined) row.published = patch.published;
  if (patch.recommended !== undefined) row.recommended = patch.recommended;
  return row;
}

// ---------- 저수준 읽기 (관리자용) ----------

/** 캐시를 거치지 않는 전체 조회 (관리자용, 비공개 포함) */
export async function readAllRecipes(): Promise<Recipe[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`레시피 목록 조회 실패: ${error.message}`);
  return ((data ?? []) as RecipeRow[]).map(toRecipe);
}

// ---------- 프론트용 조회 (캐시됨) ----------

export async function getPublishedRecipes(): Promise<Recipe[]> {
  "use cache";
  cacheTag(RECIPES_TAG);
  cacheLife("hours");

  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`공개 레시피 조회 실패: ${error.message}`);
  return ((data ?? []) as RecipeRow[]).map(toRecipe);
}

export async function getPublishedRecipe(id: string): Promise<Recipe | null> {
  "use cache";
  cacheTag(RECIPES_TAG);
  cacheLife("hours");

  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`레시피 조회 실패: ${error.message}`);
  return data ? toRecipe(data as RecipeRow) : null;
}

/** 제목 · 설명 · 재료명 기준 검색 */
export async function searchRecipes(
  query: string,
  category?: CategoryId,
): Promise<Recipe[]> {
  const recipes = await getPublishedRecipes();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return recipes.filter((recipe) => {
    if (category && !getRecipeCategories(recipe).includes(category)) {
      return false;
    }
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
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`관리자 레시피 조회 실패: ${error.message}`);
  return data ? toRecipe(data as RecipeRow) : null;
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomUUID().slice(0, 8);
    const { data, error } = await getSupabase()
      .from(TABLE)
      .insert({
        id,
        ...toRowPatch(input),
        categories: input.categories ?? [input.category],
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (!error) return toRecipe(data as RecipeRow);
    if (error.code !== "23505") {
      throw new Error(`레시피 등록 실패: ${error.message}`);
    }
  }

  throw new Error("레시피 ID 생성에 실패했습니다.");
}

export async function updateRecipe(
  id: string,
  patch: Partial<RecipeInput>,
): Promise<Recipe | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({
      ...toRowPatch(patch),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`레시피 수정 실패: ${error.message}`);
  return data ? toRecipe(data as RecipeRow) : null;
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(`레시피 삭제 실패: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

/** 공개 레시피 조회수 1 증가 (RPC 우선, 미생성 시 일반 업데이트 폴백) */
export async function incrementRecipeView(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error: rpcError } = await supabase.rpc("increment_recipe_view", {
    recipe_id: id,
  });
  if (!rpcError) return true;

  const { data, error: selectError } = await supabase
    .from(TABLE)
    .select("view_count")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (selectError || !data) return false;

  const current =
    typeof (data as { view_count?: unknown }).view_count === "number"
      ? (data as { view_count: number }).view_count
      : 0;

  const { error: updateError } = await supabase
    .from(TABLE)
    .update({ view_count: current + 1 })
    .eq("id", id)
    .eq("published", true);

  return !updateError;
}
