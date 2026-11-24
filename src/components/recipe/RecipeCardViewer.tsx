"use client";

import { useEffect, useRef, useState } from "react";
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

interface CardItem {
  key: string;
  id?: string;
  label: string;
  node: React.ReactNode;
}

interface ExitingCard {
  flightId: number;
  cardIndex: number;
  direction: "left" | "right";
  startX: number;
  startY: number;
  active: boolean;
}

interface PointerSession {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
  locked: "x" | "y" | null;
}

const SWIPE_DISTANCE = 85;
const SWIPE_VELOCITY = 0.45;
const EXIT_DURATION_MS = 340;

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
 * 카드 덱(스택) 뷰어: 겹쳐 쌓인 카드를 좌우로 기울여 쉭 넘깁니다.
 * - 왼쪽 스와이프 / 다음 버튼 / → 키: 다음 카드
 * - 오른쪽 스와이프 / 이전 버튼 / ← 키: 이전 카드
 * - 카드 내용이 길면 카드 안에서 자연스럽게 세로 스크롤됩니다.
 */
export default function RecipeCardViewer({ steps, category, leading = [] }: Props) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exiting, setExiting] = useState<ExitingCard[]>([]);

  const sessionRef = useRef<PointerSession | null>(null);
  const flightSeqRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const cards: CardItem[] = [
    ...leading.map((card) => ({
      key: card.key,
      label: card.label,
      node: card.node,
    })),
    ...steps.map((step) => ({
      key: `step-${step.stepNumber}`,
      id: `step-${step.stepNumber}`,
      label: `조리 ${step.stepNumber}단계`,
      node: (
        <>
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
        </>
      ),
    })),
  ];

  const total = cards.length;
  const last = Math.max(0, total - 1);
  const canGoPrev = index > 0;
  const canGoNext = index < last;

  function fling(direction: "left" | "right", startX = 0, startY = 0) {
    const nextIndex = direction === "left" ? index + 1 : index - 1;
    if (nextIndex < 0 || nextIndex > last) return;

    const flightId = ++flightSeqRef.current;
    const leavingIndex = index;

    setExiting((prev) => [
      ...prev,
      {
        flightId,
        cardIndex: leavingIndex,
        direction,
        startX,
        startY,
        active: false,
      },
    ]);
    setIndex(nextIndex);
    setDrag({ x: 0, y: 0, active: false });

    // 현재 손가락/원점 위치에서 화면 밖으로 부드럽게 이어서 날려 보냅니다.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setExiting((prev) =>
          prev.map((item) =>
            item.flightId === flightId ? { ...item, active: true } : item,
          ),
        );
      });
    });

    const timerId = window.setTimeout(() => {
      setExiting((prev) => prev.filter((item) => item.flightId !== flightId));
      timersRef.current = timersRef.current.filter((id) => id !== timerId);
    }, EXIT_DURATION_MS);
    timersRef.current.push(timerId);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    if (
      event.target instanceof Element &&
      event.target.closest("button, a, input, textarea, select")
    ) {
      return;
    }

    const now = performance.now();
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: now,
      lastX: event.clientX,
      lastTime: now,
      velocityX: 0,
      locked: null,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;

    // 처음 8px 이동 방향을 보고 가로 스와이프인지, 카드 내부 세로 스크롤인지 결정합니다.
    if (session.locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.15) {
        session.locked = "x";
        event.currentTarget.setPointerCapture(event.pointerId);
      } else {
        session.locked = "y";
        return;
      }
    }

    if (session.locked !== "x") return;

    const now = performance.now();
    const dt = now - session.lastTime;
    if (dt > 0) {
      session.velocityX = (event.clientX - session.lastX) / dt;
    }
    session.lastX = event.clientX;
    session.lastTime = now;

    setDrag({ x: dx, y: dy, active: true });
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLElement>) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    sessionRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (session.locked !== "x") return;

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    const velocity = session.velocityX;

    const shouldGoNext =
      canGoNext &&
      (dx <= -SWIPE_DISTANCE || (velocity <= -SWIPE_VELOCITY && dx < -28));
    const shouldGoPrev =
      canGoPrev &&
      (dx >= SWIPE_DISTANCE || (velocity >= SWIPE_VELOCITY && dx > 28));

    if (shouldGoNext) {
      fling("left", dx, dy * 0.24);
    } else if (shouldGoPrev) {
      fling("right", dx, dy * 0.24);
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      fling("left");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      fling("right");
    }
  }

  // 넘길 수 없는 끝 카드에서는 고무줄처럼 살짝만 끌리게 저항감을 줍니다.
  const atBlockedEdge =
    (drag.x < 0 && !canGoNext) || (drag.x > 0 && !canGoPrev);
  const visualX = atBlockedEdge ? drag.x * 0.25 : drag.x;
  const visualY = atBlockedEdge ? drag.y * 0.1 : drag.y * 0.24;
  const dragProgress = atBlockedEdge ? 0 : Math.min(1, Math.abs(drag.x) / 140);

  // 오른쪽으로 젖히면 이전 카드가, 그 외에는 다음 카드 최대 2장이 뒤에서 촘촘히 쌓여 보입니다.
  const isPeekingPrev = drag.active && drag.x > 12 && canGoPrev;
  const stackIndices: { cardIndex: number; depth: number }[] = [];

  if (isPeekingPrev) {
    if (index + 1 <= last) stackIndices.push({ cardIndex: index + 1, depth: 2 });
    stackIndices.push({ cardIndex: index - 1, depth: 1 });
  } else {
    if (index + 2 <= last) stackIndices.push({ cardIndex: index + 2, depth: 2 });
    if (index + 1 <= last) stackIndices.push({ cardIndex: index + 1, depth: 1 });
  }
  if (total > 0) stackIndices.push({ cardIndex: index, depth: 0 });

  const hintStrength = atBlockedEdge
    ? 0
    : Math.max(0, Math.min(1, (Math.abs(drag.x) - 18) / 70));
  const hintDirection: "left" | "right" | null =
    hintStrength > 0 ? (drag.x < 0 ? "left" : "right") : null;

  return (
    <div
      className={styles.viewer}
      role="group"
      aria-roledescription="carousel"
      aria-label="레시피 카드"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={styles.progress} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= index ? styles.done : undefined} />
        ))}
      </div>

      <div className={styles.stage}>
        {stackIndices.map(({ cardIndex, depth }) => {
          const card = cards[cardIndex];
          const isTop = depth === 0;
          const effectiveDepth = Math.max(0, depth - dragProgress);

          const style: React.CSSProperties = isTop
            ? {
                zIndex: 10,
                transform: `translate3d(${visualX}px, ${visualY}px, 0) rotate(${visualX * 0.055}deg)`,
                transition: drag.active
                  ? "none"
                  : "transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)",
              }
            : {
                zIndex: 10 - depth,
                transform: `translate3d(0, ${effectiveDepth * -8}px, 0) scale(${1 - effectiveDepth * 0.035})`,
                opacity: 1 - effectiveDepth * 0.06,
                filter: `brightness(${1 - effectiveDepth * 0.02})`,
                transition: drag.active
                  ? "none"
                  : "transform 0.36s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.36s ease, filter 0.36s ease",
              };

          return (
            <section
              key={card.key}
              id={isTop ? card.id : undefined}
              className={`${styles.card} ${isTop ? styles.topCard : styles.backCard} ${
                isTop && drag.active ? styles.dragging : ""
              }`}
              style={style}
              aria-roledescription="slide"
              aria-label={`${cardIndex + 1} / ${total} ${card.label}`}
              aria-hidden={!isTop}
              onPointerDown={isTop ? handlePointerDown : undefined}
              onPointerMove={isTop ? handlePointerMove : undefined}
              onPointerUp={isTop ? handlePointerEnd : undefined}
              onPointerCancel={isTop ? handlePointerEnd : undefined}
              onDragStart={isTop ? (event) => event.preventDefault() : undefined}
            >
              {isTop && hintDirection ? (
                <div
                  className={`${styles.swipeBadge} ${
                    hintDirection === "left" ? styles.badgeNext : styles.badgePrev
                  }`}
                  style={{ opacity: hintStrength }}
                  aria-hidden="true"
                >
                  {hintDirection === "left" ? (
                    <>
                      <span>다음</span>
                      <Chevron direction="right" />
                    </>
                  ) : (
                    <>
                      <Chevron direction="left" />
                      <span>이전</span>
                    </>
                  )}
                </div>
              ) : null}

              <div className={styles.body}>
                <div className={styles.inner}>{card.node}</div>
              </div>
            </section>
          );
        })}

        {exiting.map((item) => {
          const card = cards[item.cardIndex];
          if (!card) return null;

          const targetX = item.direction === "left" ? "-135%" : "135%";
          const targetRotate = item.direction === "left" ? -22 : 22;

          const style: React.CSSProperties = item.active
            ? {
                zIndex: 20,
                transform: `translate3d(${targetX}, ${item.startY - 24}px, 0) rotate(${targetRotate}deg)`,
                opacity: 0,
                transition:
                  "transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease",
              }
            : {
                zIndex: 20,
                transform: `translate3d(${item.startX}px, ${item.startY}px, 0) rotate(${item.startX * 0.055}deg)`,
                opacity: 1,
                transition: "none",
              };

          return (
            <section
              key={`exit-${item.flightId}`}
              className={`${styles.card} ${styles.exitingCard}`}
              style={style}
              aria-hidden="true"
            >
              <div className={styles.body}>
                <div className={styles.inner}>{card.node}</div>
              </div>
            </section>
          );
        })}
      </div>

      {/* 스와이프로 넘기고, 아래 화살표는 보조 수단입니다. */}
      <div className={styles.pager}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => fling("right")}
          disabled={!canGoPrev}
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
          onClick={() => fling("left")}
          disabled={!canGoNext}
          aria-label="다음 카드"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}
