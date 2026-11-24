import Link from "next/link";
import styles from "./HomeLink.module.scss";

/** 헤더가 없는 대신, 하위 페이지 맨 위에 두는 홈으로 가는 작은 링크 */
export default function HomeLink() {
  return (
    <nav className={styles.nav} aria-label="홈으로">
      <Link href="/" className={styles.link}>
        <span aria-hidden="true">←</span> 막식가의 레시피
      </Link>
    </nav>
  );
}
