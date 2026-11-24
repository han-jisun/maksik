import type { MetadataRoute } from "next";
import { getPublishedRecipes } from "@/lib/recipes";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recipes = await getPublishedRecipes();

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    ...recipes.map((recipe) => ({
      url: absoluteUrl(`/recipe/${recipe.id}`),
      lastModified: recipe.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
