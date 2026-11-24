"use client";

import { useRef, useState } from "react";
import type { CategoryId, RecipeStep } from "@/lib/types";
import RecipeImage from "./RecipeImage";
import styles from "./RecipeCardViewer.module.scss";

interface LeadingCard {
  key: string;
  /** 스크린 리더용 카드 이름 */
  label: string;
  node: React.ReactNode;
}

interface Props {
  steps: RecipeStep[];
  category: CategoryId;
  /** 조리 단계 앞에 오는 카드 (첫 화면, 재료 등) */
  leading?: LeadingCard[];
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
    </svg>
  );
}

/**
 * 카드 넘기기 뷰어: 한 화면에 한 장씩.
 * 첫 화면 → 재료 → 조리 단계 순서로 넘겨 봅니다.
 * 좌우 스와이프는 CSS scroll-snap 으로 처리하고, 키보드 방향키도 지원합니다.
 */
export default function RecipeCardViewer({ steps, category, leading = [] }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = leading.length + steps.length;
  const last = total - 1;

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(last, next));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const current = Math.round(track.scrollLeft / track.clientWidth);
    if (current !== index) setIndex(current);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  }

  return (
    <div
      className={styles.viewer}
      role="group"
      aria-roledescription="carousel"
      aria-label="레시피 카드"
    >
      <div className={styles.progress} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= index ? styles.done : undefined} />
        ))}
      </div>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {leading.map((card, i) => (
          <section
            key={card.key}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${total} ${card.label}`}
          >
            <div className={styles.inner}>{card.node}</div>
          </section>
        ))}

        {steps.map((step, i) => (
          <section
            key={step.stepNumber}
            id={`step-${step.stepNumber}`}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`${leading.length + i + 1} / ${total} 조리 ${step.stepNumber}단계`}
          >
            <div className={styles.inner}>
              {step.imageUrl ? (
                <RecipeImage
                  src={step.imageUrl}
                  alt={`${step.stepNumber}단계 사진`}
                  category={category}
                />
              ) : null}
              <p className={styles.label}>
                <span className={styles.number}>
                  {String(step.stepNumber).padStart(2, "0")}
                </span>
                <span className={styles.of}>Step</span>
              </p>
              <p className={styles.description}>{step.description}</p>
              {step.tip ? (
                <p className={styles.tip}>
                  <strong>TIP</strong>
                  {step.tip}
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {/* 주로 스와이프로 넘기고, 쪽 번호 옆 화살표는 보조 수단입니다. */}
      <div className={styles.pager}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="이전 카드"
        >
          <Chevron direction="left" />
        </button>
        <span className={styles.counter} aria-live="polite">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(index + 1)}
          disabled={index === last}
          aria-label="다음 카드"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}
