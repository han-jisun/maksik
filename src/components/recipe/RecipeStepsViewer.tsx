"use client";

import { useSyncExternalStore } from "react";
import type { CategoryId, RecipeStep } from "@/lib/types";
import RecipeCardViewer from "./RecipeCardViewer";
import RecipeScrollViewer from "./RecipeScrollViewer";
import styles from "./RecipeStepsViewer.module.scss";

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
  steps: RecipeStep[];
  category: CategoryId;
  headingId: string;
}

export default function RecipeStepsViewer({ steps, category, headingId }: Props) {
  const mode = useSyncExternalStore(subscribe, readMode, () => DEFAULT_MODE);

  return (
    <>
      <p className={styles.eyebrow}>Method</p>
      <div className={styles.bar}>
        <h2 id={headingId} className={styles.heading}>
          조리 과정
        </h2>
        <div className={styles.toggle} role="group" aria-label="보기 방식">
          <button
            type="button"
            className={mode === "card" ? styles.on : undefined}
            aria-pressed={mode === "card"}
            onClick={() => writeMode("card")}
          >
            카드로 보기
          </button>
          <button
            type="button"
            className={mode === "scroll" ? styles.on : undefined}
            aria-pressed={mode === "scroll"}
            onClick={() => writeMode("scroll")}
          >
            한눈에 보기
          </button>
        </div>
      </div>

      {mode === "card" ? (
        <RecipeCardViewer steps={steps} category={category} />
      ) : (
        <RecipeScrollViewer steps={steps} category={category} />
      )}
    </>
  );
}
