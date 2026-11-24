"use client";

import { useSyncExternalStore } from "react";
import type { CategoryId, RecipeStep } from "@/lib/types";
import RecipeCardViewer from "./RecipeCardViewer";
import RecipeScrollViewer from "./RecipeScrollViewer";
import styles from "./RecipeView.module.scss";

export type ViewMode = "card" | "scroll";

const STORAGE_KEY = "maksik:view-mode";
const CHANGE_EVENT = "maksik:view-mode-change";
const DEFAULT_MODE: ViewMode = "card";

// 선택한 보기 모드를 기기에 저장해 다음 레시피에서도 유지합니다.
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function readMode(): ViewMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "scroll"
      ? "scroll"
      : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function writeMode(mode: ViewMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 저장이 막힌 환경(사생활 보호 모드 등)에서는 이번 화면에서만 적용됩니다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

interface Props {
  /** 첫 화면: 분류, 제목, 소개, 사진, 요약 (서버에서 렌더링) */
  cover: React.ReactNode;
  /** 재료표 (서버에서 렌더링) */
  ingredients: React.ReactNode;
  steps: RecipeStep[];
  category: CategoryId;
}

/**
 * 레시피 본문 전체의 보기 방식 전환.
 * - 넘겨 보기: 첫 화면 → 재료 → 조리 단계를 모두 한 장씩 넘겨 봅니다.
 * - 전체 보기: 같은 내용을 한 페이지에 세로로 나열합니다.
 */
export default function RecipeView({ cover, ingredients, steps, category }: Props) {
  const mode = useSyncExternalStore(subscribe, readMode, () => DEFAULT_MODE);

  return (
    <>
      <div className={styles.modeBar}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => writeMode(mode === "card" ? "scroll" : "card")}
        >
          {mode === "card" ? (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="6" rx="1.5" />
                <path d="M4 14h16" />
                <path d="M4 18h12" />
              </svg>
              <span>전체 보기</span>
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="5" width="13" height="15" rx="1.5" />
                <path d="M20 7v11a2 2 0 0 1-2 2h-1" />
              </svg>
              <span>넘겨 보기</span>
            </>
          )}
        </button>
      </div>

      {mode === "card" ? (
        <RecipeCardViewer
          steps={steps}
          category={category}
          leading={[
            { key: "cover", label: "첫 화면", node: cover },
            { key: "ingredients", label: "재료", node: ingredients },
          ]}
        />
      ) : (
        <>
          {cover}
          <div className={styles.section}>{ingredients}</div>
          <section className={styles.section} aria-labelledby="steps">
            <p className={styles.eyebrow}>Method</p>
            <h2 id="steps" className={styles.heading}>
              조리 과정
            </h2>
            <RecipeScrollViewer steps={steps} category={category} />
          </section>
        </>
      )}
    </>
  );
}
