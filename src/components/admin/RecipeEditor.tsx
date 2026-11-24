"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES, DIFFICULTIES } from "@/lib/categories";
import type { CategoryId, Difficulty, Recipe } from "@/lib/types";
import StepEditor, { type StepDraft } from "./StepEditor";
import styles from "./RecipeEditor.module.scss";

interface IngredientDraft {
  key: string;
  name: string;
  amount: string;
}

interface ProductDraft {
  key: string;
  name: string;
  url: string;
  imageUrl: string;
}

interface Draft {
  title: string;
  description: string;
  category: CategoryId;
  thumbnailUrl: string;
  cookTimeMinutes: string;
  difficulty: Difficulty;
  servings: string;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
  coupangProducts: ProductDraft[];
  published: boolean;
  recommended: boolean;
}

// 목록 항목의 React key (순서를 바꿔도 입력 포커스가 유지되도록)
let keySeq = 0;
const newKey = () => `row-${keySeq++}`;

const newIngredient = (): IngredientDraft => ({
  key: newKey(),
  name: "",
  amount: "",
});
const newStep = (): StepDraft => ({
  key: newKey(),
  imageUrl: "",
  description: "",
  tip: "",
});
const newProduct = (): ProductDraft => ({
  key: newKey(),
  name: "",
  url: "",
  imageUrl: "",
});

function emptyDraft(): Draft {
  return {
    title: "",
    description: "",
    category: "simple",
    thumbnailUrl: "",
    cookTimeMinutes: "15",
    difficulty: "쉬움",
    servings: "2",
    ingredients: [newIngredient(), newIngredient()],
    steps: [newStep()],
    coupangProducts: [],
    published: false,
    recommended: false,
  };
}

function toDraft(recipe: Recipe): Draft {
  return {
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    thumbnailUrl: recipe.thumbnailUrl,
    cookTimeMinutes: String(recipe.cookTimeMinutes),
    difficulty: recipe.difficulty,
    servings: String(recipe.servings),
    ingredients: recipe.ingredients.map((i) => ({ key: newKey(), ...i })),
    steps: recipe.steps.map(({ imageUrl, description, tip }) => ({
      key: newKey(),
      imageUrl,
      description,
      tip,
    })),
    coupangProducts: recipe.coupangProducts.map((p) => ({
      key: newKey(),
      ...p,
    })),
    published: recipe.published,
    recommended: recipe.recommended,
  };
}

export default function RecipeEditor({ id }: { id: string | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(() =>
    id ? null : emptyDraft(),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // 수정 모드: 기존 레시피 불러오기
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetch(`/api/admin/recipes/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setError(data?.error ?? "레시피를 불러오지 못했습니다.");
          return;
        }
        setDraft(toDraft(data.recipe));
      })
      .catch(() => {
        if (!cancelled) setError("서버에 연결할 수 없습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (!draft) {
    return (
      <>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : (
          <p>불러오는 중…</p>
        )}
        <Link href="/admin" className={styles.back}>
          ← 목록으로
        </Link>
      </>
    );
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateRow<K extends "ingredients" | "coupangProducts">(
    listKey: K,
    index: number,
    patch: Partial<Draft[K][number]>,
  ) {
    setDraft((current) => {
      if (!current) return current;
      const rows = current[listKey] as Draft[K][number][];
      return {
        ...current,
        [listKey]: rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      };
    });
  }

  function removeRow(listKey: "ingredients" | "coupangProducts", index: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            [listKey]: current[listKey].filter((_, i) => i !== index),
          }
        : current,
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");

    const payload = {
      ...draft,
      cookTimeMinutes: Number(draft.cookTimeMinutes),
      servings: Number(draft.servings),
      ingredients: draft.ingredients.map(({ name, amount }) => ({ name, amount })),
      steps: draft.steps.map(({ imageUrl, description, tip }) => ({
        imageUrl,
        description,
        tip,
      })),
      coupangProducts: draft.coupangProducts.map(({ name, url, imageUrl }) => ({
        name,
        url,
        imageUrl,
      })),
    };

    try {
      const response = await fetch(
        id ? `/api/admin/recipes/${encodeURIComponent(id)}` : "/api/admin/recipes",
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (response.ok) {
        // 새 글 작성 화면을 다시 열었을 때 이전 입력이 남지 않도록 비웁니다.
        if (!id) setDraft(emptyDraft());
        setSaving(false);
        router.push("/admin");
        return;
      }
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "저장에 실패했습니다.");
    } catch {
      setError("서버에 연결할 수 없습니다.");
    }
    setSaving(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.top}>
        <h1 className={styles.title}>{id ? "레시피 수정" : "새 레시피"}</h1>
        <Link href="/admin" className={styles.back}>
          ← 목록으로
        </Link>
      </div>

      {/* ---------- 기본 정보 ---------- */}
      <fieldset className={styles.group}>
        <legend>기본 정보</legend>

        <label className={styles.field}>
          <span>제목</span>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={100}
            required
          />
        </label>

        <label className={styles.field}>
          <span>한 줄 소개</span>
          <textarea
            rows={2}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={500}
          />
        </label>

        <div className={styles.cols}>
          <label className={styles.field}>
            <span>카테고리</span>
            <select
              value={draft.category}
              onChange={(e) => set("category", e.target.value as CategoryId)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>난이도</span>
            <select
              value={draft.difficulty}
              onChange={(e) => set("difficulty", e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>조리 시간 (분)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              value={draft.cookTimeMinutes}
              onChange={(e) => set("cookTimeMinutes", e.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span>인분</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={draft.servings}
              onChange={(e) => set("servings", e.target.value)}
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>썸네일 이미지 URL</span>
          <input
            type="url"
            value={draft.thumbnailUrl}
            onChange={(e) => set("thumbnailUrl", e.target.value)}
            placeholder="https://"
          />
        </label>
      </fieldset>

      {/* ---------- 재료 ---------- */}
      <fieldset className={styles.group}>
        <legend>재료</legend>
        <ul className={styles.rows}>
          {draft.ingredients.map((item, index) => (
            <li key={item.key} className={styles.row}>
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  updateRow("ingredients", index, { name: e.target.value })
                }
                placeholder="재료명"
                aria-label={`재료 ${index + 1} 이름`}
              />
              <input
                type="text"
                value={item.amount}
                onChange={(e) =>
                  updateRow("ingredients", index, { amount: e.target.value })
                }
                placeholder="용량 (예: 1큰술)"
                aria-label={`재료 ${index + 1} 용량`}
              />
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeRow("ingredients", index)}
                aria-label={`재료 ${index + 1} 삭제`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={styles.add}
          onClick={() => set("ingredients", [...draft.ingredients, newIngredient()])}
        >
          + 재료 추가
        </button>
      </fieldset>

      {/* ---------- 조리 과정 ---------- */}
      <fieldset className={styles.group}>
        <legend>조리 과정</legend>
        <StepEditor
          steps={draft.steps}
          onChange={(steps) => set("steps", steps)}
          createStep={newStep}
        />
      </fieldset>

      {/* ---------- 쿠팡 파트너스 ---------- */}
      <fieldset className={styles.group}>
        <legend>쿠팡 파트너스 추천 상품</legend>
        <p className={styles.help}>
          레시피 하단에 노출됩니다. 상품이 하나라도 있으면 대가성 고지 문구가
          자동으로 함께 표시됩니다.
        </p>
        <ul className={styles.rows}>
          {draft.coupangProducts.map((product, index) => (
            <li key={product.key} className={styles.product}>
              <input
                type="text"
                value={product.name}
                onChange={(e) =>
                  updateRow("coupangProducts", index, { name: e.target.value })
                }
                placeholder="상품명 (예: 굴소스)"
                aria-label={`상품 ${index + 1} 이름`}
              />
              <input
                type="url"
                value={product.url}
                onChange={(e) =>
                  updateRow("coupangProducts", index, { url: e.target.value })
                }
                placeholder="파트너스 링크 https://link.coupang.com/…"
                aria-label={`상품 ${index + 1} 링크`}
              />
              <input
                type="url"
                value={product.imageUrl}
                onChange={(e) =>
                  updateRow("coupangProducts", index, {
                    imageUrl: e.target.value,
                  })
                }
                placeholder="상품 이미지 URL (선택)"
                aria-label={`상품 ${index + 1} 이미지`}
              />
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeRow("coupangProducts", index)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={styles.add}
          onClick={() =>
            set("coupangProducts", [...draft.coupangProducts, newProduct()])
          }
        >
          + 상품 추가
        </button>
      </fieldset>

      {/* ---------- 공개 설정 ---------- */}
      <fieldset className={styles.group}>
        <legend>공개 설정</legend>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          사이트에 공개
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.recommended}
            onChange={(e) => set("recommended", e.target.checked)}
          />
          메인 추천 레시피에 노출
        </label>
      </fieldset>

      <div className={styles.footer}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? "저장 중…" : id ? "수정 내용 저장" : "레시피 등록"}
        </button>
      </div>
    </form>
  );
}
