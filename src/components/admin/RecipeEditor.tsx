"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DIFFICULTIES, getRecipeCategories } from "@/lib/categories";
import type { CategoryId, Difficulty, Recipe } from "@/lib/types";
import ImageField from "./ImageField";
import StepEditor, { type StepDraft } from "./StepEditor";
import styles from "./RecipeEditor.module.scss";

const ADMIN_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "simple", label: "간단요리" },
  { id: "special", label: "특별요리" },
  { id: "seasonal", label: "제철요리" },
  { id: "diet", label: "식단한끼" },
];

interface IngredientDraft {
  key: string;
  name: string;
  amount: string;
  required: boolean;
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
  categories: CategoryId[];
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
  required: false,
});
const newStep = (initial?: Partial<Omit<StepDraft, "key">>): StepDraft => ({
  key: newKey(),
  imageUrl: initial?.imageUrl ?? "",
  description: initial?.description ?? "",
  tip: initial?.tip ?? "",
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
    categories: ["simple"],
    thumbnailUrl: "",
    cookTimeMinutes: "15",
    difficulty: "쉬움",
    servings: "2",
    ingredients: [newIngredient(), newIngredient()],
    steps: [],
    coupangProducts: [],
    published: true,
    recommended: false,
  };
}

function toDraft(recipe: Recipe): Draft {
  return {
    title: recipe.title,
    description: recipe.description,
    categories: getRecipeCategories(recipe),
    thumbnailUrl: recipe.thumbnailUrl,
    cookTimeMinutes: String(recipe.cookTimeMinutes),
    difficulty: recipe.difficulty,
    servings: String(recipe.servings),
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((i) => ({
            key: newKey(),
            name: i.name,
            amount: i.amount,
            required: i.required === true,
          }))
        : [newIngredient()],
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

  // 네이버 블로그 자동 가져오기 상태
  const [blogUrl, setBlogUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");

  function resetNewForm() {
    setDraft(emptyDraft());
    setError("");
    setBlogUrl("");
    setImportMessage("");
    setImportError("");
  }

  // 새 글 작성 화면에서 헤더의 '작성' 등을 다시 눌렀을 때도 입력값을 모두 초기화합니다.
  useEffect(() => {
    if (id) return;
    function onReset() {
      resetNewForm();
    }
    window.addEventListener("admin-recipe-reset", onReset);
    return () => window.removeEventListener("admin-recipe-reset", onReset);
  }, [id]);

  // 수정 모드: 기존 레시피 불러오기
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetch(`/api/admin/recipes/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
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
  }, [id]);

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
        <Link href="/admin/list" className={styles.back}>
          ← 목록으로
        </Link>
      </>
    );
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggleCategory(categoryId: CategoryId) {
    setDraft((current) => {
      if (!current) return current;
      const exists = current.categories.includes(categoryId);
      const categories = exists
        ? current.categories.filter((c) => c !== categoryId)
        : [...current.categories, categoryId];
      return { ...current, categories };
    });
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

  async function handleImportNaver() {
    const trimmed = blogUrl.trim();
    if (!trimmed) {
      setImportError("네이버 블로그 글 링크를 입력해 주세요.");
      return;
    }

    setImporting(true);
    setImportError("");
    setImportMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/import-naver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.draft) {
        setImportError(data?.error ?? "블로그 글을 가져오지 못했습니다.");
        setImporting(false);
        return;
      }

      const imported = data.draft as {
        title: string;
        description: string;
        categories: CategoryId[];
        thumbnailUrl: string;
        cookTimeMinutes: number;
        difficulty: Difficulty;
        servings: number;
        ingredients: { name: string; amount: string; required?: boolean }[];
        steps: { imageUrl: string; description: string; tip: string }[];
        usedAi: boolean;
        aiWarning?: string;
      };

      setDraft((current) => ({
        ...(current ?? emptyDraft()),
        title: imported.title,
        description: imported.description,
        categories: imported.categories,
        thumbnailUrl: imported.thumbnailUrl,
        cookTimeMinutes: String(imported.cookTimeMinutes),
        difficulty: imported.difficulty,
        servings: String(imported.servings),
        ingredients:
          imported.ingredients.length > 0
            ? imported.ingredients.map((i) => ({
                key: newKey(),
                name: i.name,
                amount: i.amount,
                required: i.required === true,
              }))
            : [newIngredient()],
        steps: imported.steps.map((s) => newStep(s)),
      }));

      if (imported.usedAi) {
        setImportMessage(
          `블로그 이미지 ${data.imageCount ?? imported.steps.length}장과 본문을 AI로 정리해 카드 ${imported.steps.length}장을 만들었어요. 아래에서 확인·수정 후 등록해 주세요.`,
        );
      } else {
        setImportMessage(
          imported.aiWarning ??
            `블로그에서 카드 ${imported.steps.length}장을 불러왔습니다.`,
        );
      }
    } catch {
      setImportError("서버에 연결할 수 없습니다.");
    }
    setImporting(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;

    if (draft.categories.length === 0) {
      setError("카테고리를 하나 이상 선택해 주세요.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      ...draft,
      category: draft.categories[0],
      categories: draft.categories,
      cookTimeMinutes: Number(draft.cookTimeMinutes) || 15,
      servings: Number(draft.servings) || 2,
      ingredients: draft.ingredients.map(({ name, amount, required }) => ({
        name,
        amount,
        required,
      })),
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
      const data = await response.json().catch(() => null);
      if (response.ok && data?.recipe) {
        if (!id) resetNewForm();
        router.push("/admin/list");
        return;
      } else {
        setError(data?.error ?? "저장에 실패했습니다.");
      }
    } catch {
      setError("서버에 연결할 수 없습니다.");
    }
    setSaving(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.top}>
        <h1 className={styles.title}>{id ? "레시피 수정" : "레시피 작성"}</h1>
        <Link href="/admin/list" className={styles.back}>
          등록된 목록 보기 →
        </Link>
      </div>

      {/* ---------- 네이버 블로그 자동 가져오기 ---------- */}
      {!id ? (
        <section className={styles.importBox} aria-label="네이버 블로그 가져오기">
          <div className={styles.importHead}>
            <strong>네이버 블로그에서 자동 가져오기</strong>
            <span>글 링크를 넣으면 사진과 설명을 AI가 카드로 정리해 채워 줍니다.</span>
          </div>
          <div className={styles.importRow}>
            <input
              type="url"
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleImportNaver();
                }
              }}
              placeholder="https://blog.naver.com/아이디/글번호"
              aria-label="네이버 블로그 글 링크"
              disabled={importing}
            />
            <button
              type="button"
              className={styles.importButton}
              onClick={() => void handleImportNaver()}
              disabled={importing}
            >
              {importing ? "불러오는 중…" : "AI로 가져오기"}
            </button>
          </div>
          {importing ? (
            <p className={styles.importStatus}>
              블로그 이미지를 저장하고 AI로 레시피 카드를 정리하는 중입니다…
            </p>
          ) : null}
          {importMessage ? (
            <p className={styles.importSuccess} role="status">
              {importMessage}
            </p>
          ) : null}
          {importError ? (
            <p className={styles.inlineError} role="alert">
              {importError}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* ---------- 분류 (중복 선택 체크박스) ---------- */}
      <fieldset className={styles.group}>
        <legend>카테고리</legend>
        <p className={styles.help}>해당하는 항목을 모두 선택할 수 있어요.</p>
        <div className={styles.checkGroup}>
          {ADMIN_CATEGORIES.map((category) => {
            const checked = draft.categories.includes(category.id);
            return (
              <label
                key={category.id}
                className={`${styles.checkChip} ${checked ? styles.checkChipOn : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category.id)}
                />
                <span>{category.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ---------- 제목 & 썸네일 ---------- */}
      <fieldset className={styles.group}>
        <legend>제목 및 썸네일</legend>

        <label className={styles.field}>
          <span>제목</span>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="예: 10분 완성 대파 계란볶음밥"
            maxLength={100}
            required
          />
        </label>

        <div className={styles.field}>
          <span>썸네일 이미지 (1:1)</span>
          <ImageField
            value={draft.thumbnailUrl}
            onChange={(url) => set("thumbnailUrl", url)}
            placeholder="썸네일 이미지를 클릭하거나 끌어다 놓으세요"
            ratio="1/1"
            ariaLabel="썸네일 이미지"
          />
        </div>
      </fieldset>

      {/* ---------- 재료 (필수 / 재료 / 수량) ---------- */}
      <fieldset className={styles.group}>
        <legend>재료</legend>
        <div className={styles.ingredientHeader} aria-hidden="true">
          <span>필수</span>
          <span>재료</span>
          <span>수량</span>
          <span />
        </div>
        <ul className={styles.rows}>
          {draft.ingredients.map((item, index) => (
            <li key={item.key} className={styles.row}>
              <label className={styles.reqCheck}>
                <input
                  type="checkbox"
                  checked={item.required}
                  onChange={(e) =>
                    updateRow("ingredients", index, {
                      required: e.target.checked,
                    })
                  }
                  aria-label={`재료 ${index + 1} 필수 여부`}
                />
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  updateRow("ingredients", index, { name: e.target.value })
                }
                placeholder="재료명 (예: 계란)"
                aria-label={`재료 ${index + 1} 이름`}
              />
              <input
                type="text"
                value={item.amount}
                onChange={(e) =>
                  updateRow("ingredients", index, { amount: e.target.value })
                }
                placeholder="수량 (예: 2개)"
                aria-label={`재료 ${index + 1} 수량`}
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

      {/* ---------- 카드 (3x3 이미지 그리드 + 클릭 레이어 편집) ---------- */}
      <fieldset className={styles.group}>
        <legend>레시피 카드</legend>
        <StepEditor
          steps={draft.steps}
          onChange={(steps) => set("steps", steps)}
          createStep={newStep}
          thumbnailUrl={draft.thumbnailUrl}
          onSelectThumbnail={(url) => set("thumbnailUrl", url)}
        />
      </fieldset>

      {/* ---------- 추가 정보 (선택) ---------- */}
      <details className={styles.details}>
        <summary>추가 정보 설정 (소개, 소요 시간, 공개 여부 등)</summary>
        <div className={styles.detailsBody}>
          <label className={styles.field}>
            <span>한 줄 소개</span>
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="레시피를 한 줄로 소개해 주세요."
              maxLength={500}
            />
          </label>

          <div className={styles.cols}>
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
              />
            </label>
          </div>

          <div className={styles.optionChecks}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => set("published", e.target.checked)}
              />
              사이트에 공개
            </label>
          </div>

          <div className={styles.subSection}>
            <p className={styles.subTitle}>쿠팡 파트너스 추천 상품 (선택)</p>
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
          </div>
        </div>
      </details>

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
