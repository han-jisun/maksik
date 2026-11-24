import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HomeLink from "@/components/common/HomeLink";
import AdSection from "@/components/recipe/AdSection";
import RecipeImage from "@/components/recipe/RecipeImage";
import RecipeStepsViewer from "@/components/recipe/RecipeStepsViewer";
import { categoryLabel } from "@/lib/categories";
import { getPublishedRecipe, getPublishedRecipes } from "@/lib/recipes";
import { absoluteUrl, formatCookTime, SITE_NAME } from "@/lib/site";
import type { Recipe } from "@/lib/types";
import styles from "./page.module.scss";

type Props = { params: Promise<{ id: string }> };

// 공개된 레시피는 빌드 시 미리 렌더링하고, 이후 추가된 레시피는 첫 요청 때 생성됩니다.
export async function generateStaticParams() {
  const recipes = await getPublishedRecipes();
  // Cache Components 는 최소 1개의 샘플 파라미터가 필요합니다.
  return recipes.length > 0
    ? recipes.map(({ id }) => ({ id }))
    : [{ id: "__placeholder__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getPublishedRecipe(id);
  if (!recipe) return { title: "레시피를 찾을 수 없어요" };

  const images = recipe.thumbnailUrl ? [recipe.thumbnailUrl] : undefined;
  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: `/recipe/${recipe.id}` },
    openGraph: {
      type: "article",
      title: recipe.title,
      description: recipe.description,
      url: `/recipe/${recipe.id}`,
      images,
    },
  };
}

/** 구글 검색 결과에 썸네일·조리 시간이 노출되도록 하는 schema.org/Recipe 데이터 */
function buildJsonLd(recipe: Recipe) {
  const stepImages = recipe.steps.map((s) => s.imageUrl).filter(Boolean);
  const images = [recipe.thumbnailUrl, ...stepImages]
    .filter(Boolean)
    .map(absoluteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: images.length > 0 ? images : undefined,
    author: { "@type": "Person", name: "막식가" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    datePublished: recipe.createdAt,
    dateModified: recipe.updatedAt,
    totalTime: `PT${recipe.cookTimeMinutes}M`,
    recipeYield: `${recipe.servings}인분`,
    recipeCategory: categoryLabel(recipe.category),
    recipeCuisine: "한식",
    recipeIngredient: recipe.ingredients.map((i) =>
      `${i.name} ${i.amount}`.trim(),
    ),
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      text: step.description,
      image: step.imageUrl ? absoluteUrl(step.imageUrl) : undefined,
      url: absoluteUrl(`/recipe/${recipe.id}#step-${step.stepNumber}`),
    })),
  };
}

export default function RecipePage({ params }: Props) {
  return (
    // 미리 생성되지 않은 주소로 이동할 때도 화면이 바로 뜨도록,
    // URL(params)에 의존하는 본문은 Suspense 안에서 렌더링합니다.
    <>
      <HomeLink />
      <Suspense fallback={<RecipeSkeleton />}>
        <RecipeContent params={params} />
      </Suspense>
    </>
  );
}

function RecipeSkeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-label="레시피를 불러오는 중">
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
    </div>
  );
}

async function RecipeContent({ params }: Props) {
  const { id } = await params;
  const recipe = await getPublishedRecipe(id);
  if (!recipe) notFound();

  return (
    <article className={styles.detail}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd(recipe)).replace(/</g, "\\u003c"),
        }}
      />

      {/* 책의 장 첫머리처럼: 분류 → 제목 → 소개 → 사진 → 요약 */}
      <header className={styles.header}>
        <span className={`${styles.badge} ${styles[recipe.category]}`}>
          {categoryLabel(recipe.category)}
        </span>
        <h1 className={styles.title}>{recipe.title}</h1>
        {recipe.description ? (
          <p className={styles.description}>{recipe.description}</p>
        ) : null}

        <RecipeImage
          src={recipe.thumbnailUrl}
          alt={recipe.title}
          category={recipe.category}
          priority
          className={styles.hero}
        />

        <dl className={styles.meta}>
          <div>
            <dt>소요 시간</dt>
            <dd>{formatCookTime(recipe.cookTimeMinutes)}</dd>
          </div>
          <div>
            <dt>난이도</dt>
            <dd>{recipe.difficulty}</dd>
          </div>
          <div>
            <dt>분량</dt>
            <dd>{recipe.servings}인분</dd>
          </div>
        </dl>
      </header>

      <section className={styles.section} aria-labelledby="ingredients">
        <p className={styles.eyebrow}>Ingredients</p>
        <h2 id="ingredients" className={styles.heading}>
          재료
          <span className={styles.servings}>{recipe.servings}인분 기준</span>
        </h2>
        <ul className={styles.ingredients}>
          {recipe.ingredients.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              <span>{item.name}</span>
              <span className={styles.leader} aria-hidden="true" />
              <span className={styles.amount}>{item.amount}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="steps">
        <RecipeStepsViewer
          steps={recipe.steps}
          category={recipe.category}
          headingId="steps"
        />
      </section>

      <AdSection products={recipe.coupangProducts} />
    </article>
  );
}
