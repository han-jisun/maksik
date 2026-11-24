import Footer from "@/components/common/Footer";
import styles from "./layout.module.scss";

export default function FrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
