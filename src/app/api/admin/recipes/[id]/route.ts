import { revalidateTag } from "next/cache";
import { guardAdmin, readJson } from "@/lib/auth";
import {
  deleteRecipe,
  getRecipeForAdmin,
  RECIPES_TAG,
  updateRecipe,
} from "@/lib/recipes";
import { parseRecipeInput } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

function notFound() {
  return Response.json({ error: "레시피를 찾을 수 없습니다." }, { status: 404 });
}

export async function GET(request: Request, { params }: Context) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const recipe = await getRecipeForAdmin(id);
  return recipe ? Response.json({ recipe }) : notFound();
}

/** 레시피 전체 수정 */
export async function PUT(request: Request, { params }: Context) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const parsed = parseRecipeInput(await readJson(request));
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { id } = await params;
  const recipe = await updateRecipe(id, parsed.value);
  if (!recipe) return notFound();

  revalidateTag(RECIPES_TAG, { expire: 0 });
  return Response.json({ recipe });
}

/** 공개/비공개, 추천 여부만 전환 */
export async function PATCH(request: Request, { params }: Context) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const body = (await readJson(request)) as Record<string, unknown> | null;
  const patch: { published?: boolean; recommended?: boolean } = {};
  if (typeof body?.published === "boolean") patch.published = body.published;
  if (typeof body?.recommended === "boolean") {
    patch.recommended = body.recommended;
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  const { id } = await params;
  const recipe = await updateRecipe(id, patch);
  if (!recipe) return notFound();

  revalidateTag(RECIPES_TAG, { expire: 0 });
  return Response.json({ recipe });
}

export async function DELETE(request: Request, { params }: Context) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  if (!(await deleteRecipe(id))) return notFound();

  revalidateTag(RECIPES_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
