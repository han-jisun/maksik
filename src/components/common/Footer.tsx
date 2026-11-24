import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="안내">
        <Link href="/about">사이트 소개</Link>
        <Link href="/privacy">개인정보처리방침</Link>
      </nav>
      <p className={styles.copy}>© {SITE_NAME}</p>
    </footer>
  );
}
