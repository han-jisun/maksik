import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import styles from "./layout.module.scss";

export const metadata: Metadata = {
  title: { default: "관리자", template: "%s | 막식가의 레시피 관리자" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <AdminHeader />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
