import type { Metadata } from "next";
import { Suspense } from "react";
import RecipeEditorLoader from "@/components/admin/RecipeEditorLoader";

export const metadata: Metadata = { title: "레시피 작성" };

export default function AdminPage() {
  return (
    // ?id= 쿼리(수정 대상)를 읽는 부분은 Suspense 안에서 렌더링합니다.
    <Suspense fallback={<p>불러오는 중…</p>}>
      <RecipeEditorLoader />
    </Suspense>
  );
}
