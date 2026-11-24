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

  const recommended = recipes.filter((r) => r.recommended);
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

      {category === "all" && recommended.length > 0 ? (
        <section className={styles.section}>
          {/* TODO: 좋아요 기능이 생기면 관리자 지정(recommended) 대신 좋아요 순으로 바꿉니다. */}
          <h2 className={styles.heading}>인기 레시피</h2>
          <RecipeList recipes={recommended} layout="row" />
        </section>
      ) : null}
    </>
  );
}
