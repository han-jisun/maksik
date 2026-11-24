# 🍳 막식가의 레시피

개인 요리책 형태의 레시피 아카이브 (`https://maksik-recipe.com`).
모바일 퍼스트 · Next.js App Router · `*.module.scss` (Tailwind 미사용).

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기 (ADMIN_PASSWORD, SESSION_SECRET)
npm run dev                  # http://localhost:3000
```

- 관리자: `http://localhost:3000/admin` → 비밀번호는 `.env.local` 의 `ADMIN_PASSWORD`
- `npm run build` / `npm run start` / `npm run lint`

## 구조

```
data/recipes.json             # 임시 레시피 저장소 (DB 확정 전)
src/
├── proxy.ts                  # /admin, /api/admin 접근 차단 (Next 16 의 Middleware)
├── app/
│   ├── (front)/              # 홈, /search, /recipe/[id], /about, /privacy
│   ├── admin/                # /admin, /admin/login, /admin/write(?id=)
│   ├── api/auth/             # login, logout
│   ├── api/admin/recipes/    # 레시피 CRUD (관리자 전용)
│   ├── sitemap.ts, robots.ts
├── components/
│   ├── common/               # Header, Footer, SearchBar, CategoryTabs
│   ├── recipe/               # RecipeCardViewer, RecipeScrollViewer, AdSection …
│   └── admin/                # RecipeEditor, StepEditor, AdminRecipeList …
├── lib/                      # types, recipes(저장소), validate, session/auth, site
└── styles/                   # globals.scss, _variables.scss, _mixins.scss
```

SCSS 에서는 `@use "variables" as *;`, `@use "mixins" as *;` 로 공통 값을 불러옵니다
(`next.config.ts` 의 `sassOptions.loadPaths`).

## 아직 정해지지 않은 것

| 항목 | 현재 상태 | 바꿀 곳 |
| :-- | :-- | :-- |
| DB | `data/recipes.json` 파일 저장 (서버리스 배포에서는 쓰기 불가) | `src/lib/recipes.ts` 의 읽기/쓰기 함수 |
| 이미지 저장소 | 이미지 URL 을 직접 입력, `<img>` 로 표시 | 업로드 API 추가 후 `RecipeImage.tsx` 를 `next/image` 로 전환 |
| AdSense | 환경 변수가 없으면 개발 모드에서만 자리 표시 | `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT` |
| 쿠팡 파트너스 | 샘플 데이터는 일반 검색 링크 | 관리자 화면에서 실제 파트너스 링크로 교체 |
| 문의 메일 | 임시 주소 | `src/lib/site.ts` 의 `CONTACT_EMAIL` |

## 참고

Next.js 16 의 Cache Components 를 사용합니다. 프론트 조회 함수는 `"use cache"` + `cacheTag("recipes")`
로 캐시되고, 관리자 API 에서 변경이 일어나면 `revalidateTag` 로 즉시 무효화합니다.
