import Form from "next/form";
import styles from "./SearchBar.module.scss";

interface Props {
  defaultValue?: string;
  /** 검색 결과 페이지에서 선택된 카테고리를 유지할 때 사용 */
  category?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ defaultValue, category, autoFocus }: Props) {
  return (
    <Form action="/search" className={styles.form} role="search">
      <input
        key={defaultValue}
        type="search"
        name="q"
        className={styles.input}
        placeholder="오늘 뭐 해먹지?"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        aria-label="레시피 검색어"
        enterKeyHint="search"
      />
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <button type="submit" className={styles.button} aria-label="검색">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </Form>
  );
}
