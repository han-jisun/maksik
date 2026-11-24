import { SITE_NAME } from "@/lib/site";
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.copy}>© {SITE_NAME}</p>
    </footer>
  );
}
