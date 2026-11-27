"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { categoryLabel, getRecipeCategories } from "@/lib/categories";
import type { Recipe } from "@/lib/types";
import styles from "./AdminRecipeList.module.scss";

export default function AdminRecipeList() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  /** 관리자 API 호출 공통 처리. 세션이 만료되면 로그인 화면으로 보냅니다. */
  const request = useCallback(
    async (url: string, init?: RequestInit) => {
      const response = await fetch(url, {
        ...init,
        headers: init?.body ? { "Content-Type": "application/json" } : undefined,
        cache: "no-store",
      });
      if (response.status === 401) {
        router.replace("/admin/login");
        return null;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "요청에 실패했습니다.");
      return data;
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    request("/api/admin/recipes")
      .then((data) => {
        if (!cancelled && data) setRecipes(data.recipes);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  async function patch(
    recipe: Recipe,
    change: { published?: boolean },
  ) {
    setBusyId(recipe.id);
    setError("");
    try {
      const data = await request(`/api/admin/recipes/${recipe.id}`, {
        method: "PATCH",
        body: JSON.stringify(change),
      });
      if (data) {
        setRecipes(
          (list) =>
            list?.map((r) => (r.id === recipe.id ? data.recipe : r)) ?? null,
        );
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  }

  async function remove(recipe: Recipe) {
    if (!window.confirm(`‘${recipe.title}’ 레시피를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) {
      return;
    }
    setBusyId(recipe.id);
    setError("");
    try {
      const data = await request(`/api/admin/recipes/${recipe.id}`, {
        method: "DELETE",
      });
      if (data) {
        setRecipes((list) => list?.filter((r) => r.id !== recipe.id) ?? null);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  }

  return (
    <>
      <div className={styles.top}>
        <h1 className={styles.title}>
          레시피 목록
          {recipes ? <span>{recipes.length}</span> : null}
        </h1>
        <Link href="/admin" className={styles.write}>
          + 새 레시피
        </Link>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {recipes === null ? (
        error ? null : <p className={styles.empty}>불러오는 중…</p>
      ) : recipes.length === 0 ? (
        <p className={styles.empty}>
          등록된 레시피가 없습니다. 첫 레시피를 작성해 보세요.
        </p>
      ) : (
        <ul className={styles.list}>
          {recipes.map((recipe) => {
            const busy = busyId === recipe.id;
            return (
              <li key={recipe.id} className={styles.item}>
                <div className={styles.info}>
                  <p className={styles.badges}>
                    <span
                      className={recipe.published ? styles.public : styles.private}
                    >
                      {recipe.published ? "공개" : "비공개"}
                    </span>
                    {getRecipeCategories(recipe).map((cat) => (
                      <span key={cat}>{categoryLabel(cat)}</span>
                    ))}
                  </p>
                  <h2 className={styles.name}>{recipe.title}</h2>
                  <p className={styles.meta}>
                    {recipe.cookTimeMinutes}분 · {recipe.difficulty} ·{" "}
                    {recipe.steps.length}단계 · 수정{" "}
                    {recipe.updatedAt.slice(0, 10)}
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patch(recipe, { published: !recipe.published })}
                  >
                    {recipe.published ? "비공개로" : "공개하기"}
                  </button>
                  <Link href={`/admin?id=${recipe.id}`}>수정</Link>
                  {recipe.published ? (
                    <Link href={`/recipe/${recipe.id}`} target="_blank">
                      보기
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className={styles.danger}
                    disabled={busy}
                    onClick={() => remove(recipe)}
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
