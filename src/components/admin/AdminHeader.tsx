"use client";

import Link from "next/link";
import styles from "./AdminHeader.module.scss";

export default function AdminHeader() {
  function notifyReset() {
    window.dispatchEvent(new CustomEvent("admin-recipe-reset"));
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/admin" className={styles.logo} onClick={notifyReset}>
          레시피 관리자
        </Link>
        <nav className={styles.nav}>
          <Link href="/admin" onClick={notifyReset}>
            작성
          </Link>
          <Link href="/admin/list">목록</Link>
          <Link href="/" target="_blank">
            사이트 보기
          </Link>
        </nav>
      </div>
    </header>
  );
}
