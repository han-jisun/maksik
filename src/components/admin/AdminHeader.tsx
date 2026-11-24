"use client";

import Link from "next/link";
import styles from "./AdminHeader.module.scss";

export default function AdminHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/admin" className={styles.logo}>
          레시피 관리자
        </Link>
        <nav className={styles.nav}>
          <Link href="/admin">작성</Link>
          <Link href="/admin/list">목록</Link>
          <Link href="/" target="_blank">
            사이트 보기
          </Link>
        </nav>
      </div>
    </header>
  );
}
