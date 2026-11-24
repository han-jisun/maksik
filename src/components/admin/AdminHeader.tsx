"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./AdminHeader.module.scss";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={isLogin ? "/admin/login" : "/admin"} className={styles.logo}>
          레시피 관리자
        </Link>
        {isLogin ? null : (
          <nav className={styles.nav}>
            <Link href="/" target="_blank">
              사이트 보기
            </Link>
            <button type="button" onClick={logout}>
              로그아웃
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
