import type { CategoryId, Difficulty } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: "simple", label: "간편한끼", description: "빠르고 쉽게 만드는 일상식" },
  {
    id: "special",
    label: "특별한끼",
    description: "주말, 손님 초대, 기분 전환용 요리",
  },
  {
    id: "seasonal",
    label: "제철한끼",
    description: "계절 식재료를 활용한 요리",
  },
];

export const DIFFICULTIES: Difficulty[] = ["쉬움", "보통", "어려움"];

export function isCategoryId(value: unknown): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
