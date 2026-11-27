import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import styles from "./CategoryTabs.module.scss";

export type CategoryFilter = CategoryId | "all";

const TABS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "전체" },
  ...CATEGORIES.map(({ id, label }) => ({ id, label })),
];

interface Props {
  active: CategoryFilter | null;
  /** "전체" 탭 표시 여부 (기본값 true) */
  showAll?: boolean;
  /** 버튼 모드: 클릭 시 호출 (클라이언트 컴포넌트에서 사용) */
  onSelect?: (id: CategoryFilter) => void;
  /** 링크 모드: 탭별 이동 주소 (서버 컴포넌트에서 사용) */
  hrefs?: Partial<Record<CategoryFilter, string>>;
}

export default function CategoryTabs({
  active,
  showAll = true,
  onSelect,
  hrefs,
}: Props) {
  const tabs = showAll ? TABS : TABS.filter((tab) => tab.id !== "all");

  return (
    <nav className={styles.tabs} aria-label="카테고리">
      {tabs.map((tab) => {
        const className =
          tab.id === active ? `${styles.tab} ${styles.active}` : styles.tab;
        const href = hrefs?.[tab.id];

        if (href) {
          return (
            <Link
              key={tab.id}
              href={href}
              className={className}
              aria-current={tab.id === active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            className={className}
            aria-pressed={tab.id === active}
            onClick={() => onSelect?.(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
