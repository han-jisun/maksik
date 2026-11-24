import Link from "next/link";
import styles from "./HomeLink.module.scss";

/** 헤더가 없는 대신, 하위 페이지 맨 위에 두는 뒤로가기(홈) 아이콘 */
export default function HomeLink() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.link} aria-label="홈으로 돌아가기">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 12H4" />
          <path d="m10 6-6 6 6 6" />
        </svg>
      </Link>
    </nav>
  );
}
