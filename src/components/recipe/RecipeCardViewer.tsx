"use client";

import { useRef, useState } from "react";
import type { CategoryId, RecipeStep } from "@/lib/types";
import RecipeImage from "./RecipeImage";
import styles from "./RecipeCardViewer.module.scss";

interface Props {
  steps: RecipeStep[];
  category: CategoryId;
}

/**
 * 카드 넘기기 뷰어: 한 화면에 한 단계씩.
 * 좌우 스와이프는 CSS scroll-snap 으로 처리하고, 이전/다음 버튼과 방향키를 함께 지원합니다.
 */
export default function RecipeCardViewer({ steps, category }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = steps.length - 1;

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
      aria-label="조리 과정 카드"
    >
      <div className={styles.progress} aria-hidden="true">
        {steps.map((step, i) => (
          <span
            key={step.stepNumber}
            className={i <= index ? styles.done : undefined}
          />
        ))}
      </div>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {steps.map((step) => (
          <section
            key={step.stepNumber}
            id={`step-${step.stepNumber}`}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`${step.stepNumber} / ${steps.length} 단계`}
          >
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
          </section>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.prev}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          이전
        </button>
        <span className={styles.counter} aria-live="polite">
          {index + 1} / {steps.length}
        </span>
        <button
          type="button"
          className={styles.next}
          onClick={() => goTo(index + 1)}
          disabled={index === last}
        >
          다음
        </button>
      </div>
    </div>
  );
}
