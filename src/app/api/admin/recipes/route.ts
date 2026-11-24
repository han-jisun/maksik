import { revalidateTag } from "next/cache";
import { guardAdmin, readJson } from "@/lib/auth";
import { createRecipe, readAllRecipes, RECIPES_TAG } from "@/lib/recipes";
import { parseRecipeInput } from "@/lib/validate";

/** 전체 레시피 목록 (비공개 포함) */
export async function GET(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const recipes = await readAllRecipes();
  recipes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ recipes });
}

/** 레시피 등록 */
export async function POST(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const parsed = parseRecipeInput(await readJson(request));
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const recipe = await createRecipe(parsed.value);
  revalidateTag(RECIPES_TAG, { expire: 0 });
  return Response.json({ recipe }, { status: 201 });
}
