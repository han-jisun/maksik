import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatCookTime } from "@/lib/site";
import type { Recipe } from "@/lib/types";
import RecipeImage from "./RecipeImage";
import styles from "./RecipeList.module.scss";

/** 목록 화면에 필요한 필드만 추린 레시피 요약 */
export type RecipeSummary = Pick<
  Recipe,
  | "id"
  | "title"
  | "description"
  | "category"
  | "thumbnailUrl"
  | "cookTimeMinutes"
  | "difficulty"
  | "recommended"
>;

export function toSummary(recipe: Recipe): RecipeSummary {
  const {
    id,
    title,
    description,
    category,
    thumbnailUrl,
    cookTimeMinutes,
    difficulty,
    recommended,
  } = recipe;
  return {
    id,
    title,
    description,
    category,
    thumbnailUrl,
    cookTimeMinutes,
    difficulty,
    recommended,
  };
}

interface Props {
  recipes: RecipeSummary[];
  /** grid: 2열 카드, row: 가로 스크롤 */
  layout?: "grid" | "row";
  emptyMessage?: string;
}

export default function RecipeList({
  recipes,
  layout = "grid",
  emptyMessage = "아직 등록된 레시피가 없어요.",
}: Props) {
  if (recipes.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <ul className={layout === "row" ? styles.row : styles.grid}>
      {recipes.map((recipe, index) => (
        <li key={recipe.id} className={styles.item}>
          <Link href={`/recipe/${recipe.id}`} className={styles.card}>
            <RecipeImage
              src={recipe.thumbnailUrl}
              alt={recipe.title}
              category={recipe.category}
              ratio="1/1"
              priority={index < 2}
            />
            <div className={styles.body}>
              <span className={`${styles.badge} ${styles[recipe.category]}`}>
                {categoryLabel(recipe.category)}
              </span>
              <h3 className={styles.title}>{recipe.title}</h3>
              <p className={styles.meta}>
                {formatCookTime(recipe.cookTimeMinutes)} · {recipe.difficulty}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
