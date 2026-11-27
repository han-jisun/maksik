import { revalidateTag } from "next/cache";
import { incrementRecipeView, RECIPES_TAG } from "@/lib/recipes";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!id || id.length > 64) {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    const updated = await incrementRecipeView(id);
    if (updated) {
      revalidateTag(RECIPES_TAG, { expire: 0 });
    }
    return Response.json({ ok: updated });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
