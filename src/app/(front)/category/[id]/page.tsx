import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import RecipeList, { toSummary } from "@/components/recipe/RecipeList";
import {
  CATEGORIES,
  getRecipeCategories,
  isCategoryId,
} from "@/lib/categories";
import { getPublishedRecipes } from "@/lib/recipes";
import { SITE_NAME } from "@/lib/site";
import styles from "./page.module.scss";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isCategoryId(id)) return { title: "카테고리를 찾을 수 없어요" };

  const current = CATEGORIES.find((c) => c.id === id);
  return {
    title: current?.label ?? id,
    description: current?.description,
    alternates: { canonical: `/category/${id}` },
  };
}

export default function CategoryPage({ params }: Props) {
  return (
    <>
      <header className={styles.topHeader}>
        <Link href="/" className={styles.iconBtn} aria-label="홈으로 돌아가기">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </Link>

        <Link href="/" className={styles.brand}>
          <span className={styles.brandSub}>Maksik&rsquo;s Cookbook</span>
          <span className={styles.brandTitle}>{SITE_NAME}</span>
        </Link>

        <Link href="/search" className={styles.iconBtn} aria-label="레시피 검색">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
      </header>
      <Suspense fallback={<p className={styles.loading}>불러오는 중…</p>}>
        <CategoryContent params={params} />
      </Suspense>
    </>
  );
}

async function CategoryContent({ params }: Props) {
  const { id } = await params;
  if (!isCategoryId(id)) notFound();

  const current = CATEGORIES.find((c) => c.id === id);
  const all = await getPublishedRecipes();
  const filtered = all
    .filter((recipe) => getRecipeCategories(recipe).includes(id))
    .map(toSummary);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>{current?.label}</h1>
        {current ? <p className={styles.sub}>{current.description}</p> : null}
      </div>

      <p className={styles.count}>총 {filtered.length}개의 레시피</p>

      <RecipeList
        recipes={filtered}
        layout="grid"
        emptyMessage="이 장에는 아직 레시피가 없어요."
      />
    </>
  );
}
