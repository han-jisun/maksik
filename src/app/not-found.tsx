import Link from "next/link";
import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <p className={styles.emoji} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
      <p className={styles.text}>
        주소가 바뀌었거나 삭제된 레시피일 수 있습니다.
      </p>
      <Link href="/" className={styles.link}>
        홈으로 가기
      </Link>
    </main>
  );
}
