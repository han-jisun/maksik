import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryTabs, {
  type CategoryFilter,
} from "@/components/common/CategoryTabs";
import HomeLink from "@/components/common/HomeLink";
import SearchBar from "@/components/common/SearchBar";
import RecipeList, { toSummary } from "@/components/recipe/RecipeList";
import { CATEGORIES, isCategoryId } from "@/lib/categories";
import { searchRecipes } from "@/lib/recipes";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "레시피 검색",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <HomeLink />
      <h1 className={styles.title}>레시피 검색</h1>
      {/* searchParams 는 요청 시점 데이터라 Suspense 안에서 읽습니다. */}
      <Suspense fallback={<SearchFallback />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function SearchFallback() {
  return (
    <>
      <SearchBar />
      <p className={styles.count}>검색 중…</p>
    </>
  );
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function searchHref(q: string, category: CategoryFilter): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category !== "all") params.set("category", category);
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

async function SearchContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q).slice(0, 50);
  const rawCategory = first(params.category);
  const category: CategoryFilter = isCategoryId(rawCategory)
    ? rawCategory
    : "all";

  const results = await searchRecipes(
    q,
    category === "all" ? undefined : category,
  );

  const hrefs = {
    all: searchHref(q, "all"),
    ...Object.fromEntries(CATEGORIES.map((c) => [c.id, searchHref(q, c.id)])),
  } as Record<CategoryFilter, string>;

  return (
    <>
      <SearchBar
        defaultValue={q}
        category={category === "all" ? undefined : category}
        autoFocus={!q}
      />
      <div className={styles.tabs}>
        <CategoryTabs active={category} hrefs={hrefs} />
      </div>
      <p className={styles.count} aria-live="polite">
        {q ? (
          <>
            <strong>‘{q}’</strong> 검색 결과 {results.length}개
          </>
        ) : (
          <>전체 레시피 {results.length}개</>
        )}
      </p>
      <RecipeList
        recipes={results.map(toSummary)}
        emptyMessage="조건에 맞는 레시피가 없어요. 다른 재료나 요리 이름으로 검색해 보세요."
      />
    </>
  );
}
