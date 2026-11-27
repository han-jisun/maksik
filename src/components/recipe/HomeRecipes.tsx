import CategoryTabs from "@/components/common/CategoryTabs";
import { CATEGORIES } from "@/lib/categories";
import RecipeList, { type RecipeSummary } from "./RecipeList";
import styles from "./HomeRecipes.module.scss";

const HOME_SWIPER_LIMIT = 5;

const CATEGORY_HREFS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, `/category/${c.id}`]),
);

export default function HomeRecipes({ recipes }: { recipes: RecipeSummary[] }) {
  const latest = recipes.slice(0, HOME_SWIPER_LIMIT);
  const popular = [...recipes]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, HOME_SWIPER_LIMIT);

  return (
    <>
      <CategoryTabs active={null} showAll={false} hrefs={CATEGORY_HREFS} />

      <section className={styles.section}>
        <h2 className={styles.heading}>최신 레시피</h2>
        <RecipeList
          recipes={latest}
          layout="row"
          emptyMessage="아직 등록된 레시피가 없어요."
        />
      </section>

      {popular.length > 0 ? (
        <section className={styles.section}>
          <h2 className={styles.heading}>인기 레시피</h2>
          <RecipeList recipes={popular} layout="row" />
        </section>
      ) : null}
    </>
  );
}
