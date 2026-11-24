import styles from "./Doodles.module.scss";

/**
 * 손으로 그린 듯한 수채화풍 장식 그림 (과일 · 채소).
 * 선이 살짝 떨리도록 SVG 필터(#doodle-wobble)를 겁니다.
 * 필터 정의는 페이지에 한 번만 있으면 되므로 <DoodleDefs /> 를 한 번 렌더링하세요.
 */
export function DoodleDefs() {
  return (
    <svg width="0" height="0" className={styles.defs} aria-hidden="true">
      <defs>
        <filter id="doodle-wobble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
        </filter>
      </defs>
    </svg>
  );
}

interface DoodleProps {
  className?: string;
}

function Svg({
  className,
  viewBox = "0 0 64 64",
  children,
}: DoodleProps & { viewBox?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      className={[styles.doodle, className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <g filter="url(#doodle-wobble)">{children}</g>
    </svg>
  );
}

/** 접시: 물감으로 두 번 두른 테두리 */
export function Plate({ className }: DoodleProps) {
  return (
    <Svg className={className} viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="86" className={styles.plate} />
      <circle cx="100" cy="100" r="92" className={styles.rimOuter} />
      <circle cx="100" cy="100" r="80" className={styles.rimInner} />
    </Svg>
  );
}

/** 토마토 */
export function Tomato({ className }: DoodleProps) {
  return (
    <Svg className={className}>
      <ellipse
        cx="32"
        cy="37"
        rx="22"
        ry="20"
        className={`${styles.red} ${styles.outlined}`}
      />
      <path d="M20 30 C 22 26, 25 24, 28 23" className={styles.highlight} />
      <path
        d="M32 20 L32 8 M32 20 L23 13 M32 20 L41 13 M32 20 L20 21 M32 20 L44 21"
        className={styles.stem}
      />
    </Svg>
  );
}

/** 당근 */
export function Carrot({ className }: DoodleProps) {
  return (
    <Svg className={className}>
      <path
        d="M21 19 C 27 14, 37 14, 43 19 C 42 35, 37 50, 32 61 C 27 50, 22 35, 21 19 Z"
        className={`${styles.orange} ${styles.outlined}`}
      />
      <path d="M26 28 h9 M29 39 h7 M29 48 h4" className={styles.line} />
      <path
        d="M32 16 C 30 10, 26 6, 21 4 M32 16 L33 2 M32 16 C 35 10, 40 7, 45 5"
        className={styles.stem}
      />
    </Svg>
  );
}

/** 레몬 */
export function Lemon({ className }: DoodleProps) {
  return (
    <Svg className={className}>
      <path
        d="M6 33 C 12 15, 42 11, 53 27 L60 30 L55 37 C 47 53, 15 52, 6 33 Z"
        className={`${styles.yellow} ${styles.outlined}`}
      />
      <path d="M17 26 C 22 21, 29 19, 36 19" className={styles.highlight} />
    </Svg>
  );
}

/** 빨간 고추 */
export function Chili({ className }: DoodleProps) {
  return (
    <Svg className={className}>
      <path
        d="M13 19 C 15 41, 34 57, 57 52 C 43 46, 31 34, 27 15 C 22 13, 16 14, 13 19 Z"
        className={`${styles.red} ${styles.outlined}`}
      />
      <path d="M19 24 C 22 35, 29 43, 38 48" className={styles.highlight} />
      <path d="M20 15 C 19 9, 22 5, 28 4" className={styles.stem} />
    </Svg>
  );
}

/** 양파 */
export function Onion({ className }: DoodleProps) {
  return (
    <Svg className={className}>
      <path
        d="M32 14 C 50 18, 57 36, 47 50 C 41 59, 23 59, 17 50 C 7 36, 14 18, 32 14 Z"
        className={`${styles.onion} ${styles.outlined}`}
      />
      <path
        d="M32 15 C 24 27, 24 44, 30 56 M32 15 C 40 27, 40 44, 34 56 M32 14 C 31 9, 33 6, 37 3"
        className={styles.line}
      />
    </Svg>
  );
}

/** 반으로 자른 아보카도 */
export function Avocado({ className }: DoodleProps) {
  return (
    <Svg className={className}>
      <path
        d="M32 5 C 44 5, 55 30, 51 44 C 47 58, 17 58, 13 44 C 9 30, 20 5, 32 5 Z"
        className={`${styles.deepGreen} ${styles.outlined}`}
      />
      <path
        d="M32 11 C 41 11, 49 31, 46 42 C 43 52, 21 52, 18 42 C 15 31, 23 11, 32 11 Z"
        className={styles.flesh}
      />
      <circle cx="32" cy="39" r="8.5" className={`${styles.ochre} ${styles.outlined}`} />
    </Svg>
  );
}
