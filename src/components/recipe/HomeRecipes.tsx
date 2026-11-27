"use client";

import { useState } from "react";
import CategoryTabs, {
  type CategoryFilter,
} from "@/components/common/CategoryTabs";
import { CATEGORIES, getRecipeCategories } from "@/lib/categories";
import RecipeList, { type RecipeSummary } from "./RecipeList";
import styles from "./HomeRecipes.module.scss";

export default function HomeRecipes({ recipes }: { recipes: RecipeSummary[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");

  const filtered =
    category === "all"
      ? recipes
      : recipes.filter((r) => getRecipeCategories(r).includes(category));
  const current = CATEGORIES.find((c) => c.id === category);

  return (
    <>
      <CategoryTabs active={category} onSelect={setCategory} />

      {/* 목록은 모두 가로로 자유롭게 넘기는 방식입니다. */}
      <section className={styles.section}>
        <h2 className={styles.heading}>
          {current ? current.label : "최신 레시피"}
        </h2>
        {current ? <p className={styles.sub}>{current.description}</p> : null}
        <RecipeList
          recipes={filtered}
          layout="row"
          emptyMessage="이 장에는 아직 레시피가 없어요."
        />
      </section>
    </>
  );
}
