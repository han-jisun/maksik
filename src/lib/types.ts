export type CategoryId = "simple" | "special" | "seasonal";

export type Difficulty = "쉬움" | "보통" | "어려움";

export interface Ingredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  stepNumber: number;
  imageUrl: string;
  description: string;
  tip: string;
}

/** 쿠팡 파트너스 추천 상품 (재료/도구) */
export interface CoupangProduct {
  name: string;
  url: string;
  imageUrl: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  thumbnailUrl: string;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  coupangProducts: CoupangProduct[];
  published: boolean;
  recommended: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 관리자 작성 폼에서 보내는 값 (id, 날짜는 서버에서 채움) */
export type RecipeInput = Omit<Recipe, "id" | "createdAt" | "updatedAt">;
