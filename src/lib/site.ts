export const SITE_NAME = "막식가의 레시피";
export const SITE_DESCRIPTION =
  "주방에서 스마트폰으로 보며 따라 하기 좋은 막식가의 개인 요리책. 간편한끼, 특별한끼, 제철한끼 레시피를 모았습니다.";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://maksik-recipe.com"
).replace(/\/$/, "");

// TODO: 실제로 수신 가능한 문의 메일 주소로 바꿔 주세요.
export const CONTACT_EMAIL = "contact@maksik-recipe.com";

export const COUPANG_DISCLOSURE =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}
