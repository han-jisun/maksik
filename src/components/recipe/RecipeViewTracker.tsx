"use client";

import { useEffect } from "react";

/** 레시피 상세 페이지 방문 시 조회수를 1 증가시킵니다. */
export default function RecipeViewTracker({ id }: { id: string }) {
  useEffect(() => {
    void fetch(`/api/recipes/${encodeURIComponent(id)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);
  }, [id]);

  return null;
}
