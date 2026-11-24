import type { Metadata } from "next";
import AdminRecipeList from "@/components/admin/AdminRecipeList";

export const metadata: Metadata = { title: "레시피 목록" };

export default function AdminListPage() {
  return <AdminRecipeList />;
}
