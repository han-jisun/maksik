"use client";

import { useSearchParams } from "next/navigation";
import RecipeEditor from "./RecipeEditor";

/** /admin/write (신규) 와 /admin/write?id=... (수정) 을 구분해 에디터를 띄웁니다. */
export default function RecipeEditorLoader() {
  const id = useSearchParams().get("id");
  // key 를 바꿔 다른 레시피로 이동하면 입력 상태가 초기화되도록 합니다.
  return <RecipeEditor key={id ?? "new"} id={id} />;
}
