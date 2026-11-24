import type { Metadata } from "next";
import Link from "next/link";
import HomeLink from "@/components/common/HomeLink";
import prose from "@/components/common/Prose.module.scss";
import { CATEGORIES } from "@/lib/categories";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "사이트 소개",
  description: `${SITE_NAME}는 어떤 곳인지 소개합니다.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className={prose.prose}>
      <HomeLink />
      <h1>사이트 소개</h1>
      <p>
        <strong>{SITE_NAME}</strong>는 먹는 걸 좋아하는 막식가가 직접 해 먹어
        보고 괜찮았던 요리만 기록해 두는 개인 요리책입니다.
      </p>
      <p>
        요리하면서 스마트폰으로 보기 편하도록 만들었습니다. 조리 과정은 한
        단계씩 넘겨 보는 <strong>카드 보기</strong>와 전체를 한 번에 훑어보는{" "}
        <strong>한눈에 보기</strong> 중에서 편한 방식을 고를 수 있어요.
      </p>

      <h2>이런 레시피를 모읍니다</h2>
      <ul>
        {CATEGORIES.map((category) => (
          <li key={category.id}>
            <strong>{category.label}</strong> — {category.description}
          </li>
        ))}
      </ul>

      <h2>광고 및 제휴 안내</h2>
      <p>
        사이트 운영을 위해 Google AdSense 광고와 쿠팡 파트너스 제휴 링크를
        사용합니다. 제휴 링크를 통해 구매가 이루어지면 운영자가 일정액의
        수수료를 받을 수 있으며, 구매자에게 추가 비용은 발생하지 않습니다.
        자세한 내용은 <Link href="/privacy">개인정보처리방침</Link>을 참고해
        주세요.
      </p>

      <h2>문의</h2>
      <p>
        레시피 오류 제보나 기타 문의는{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 로 보내 주세요.
      </p>
    </div>
  );
}
