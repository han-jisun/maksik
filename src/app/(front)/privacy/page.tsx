import type { Metadata } from "next";
import HomeLink from "@/components/common/HomeLink";
import prose from "@/components/common/Prose.module.scss";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SITE_NAME}의 개인정보처리방침입니다.`,
  alternates: { canonical: "/privacy" },
};

// 시행일은 방침 내용을 바꿀 때 함께 수정해 주세요.
const EFFECTIVE_DATE = "2026년 11월 24일";

export default function PrivacyPage() {
  return (
    <div className={prose.prose}>
      <HomeLink />
      <h1>개인정보처리방침</h1>
      <p>
        {SITE_NAME}(이하 “사이트”)는 이용자의 개인정보를 중요하게 생각하며,
        관련 법령을 준수합니다. 본 방침은 사이트가 어떤 정보를 어떻게
        다루는지 설명합니다.
      </p>

      <h2>1. 수집하는 개인정보</h2>
      <p>
        사이트는 회원가입, 댓글 등 이용자가 개인정보를 직접 입력하는 기능을
        제공하지 않으며, 이름·연락처 등 개인을 식별할 수 있는 정보를 직접
        수집하지 않습니다.
      </p>
      <p>
        조리 과정 보기 방식(카드/스크롤) 설정은 이용자의 기기(브라우저 저장소)
        에만 저장되며 서버로 전송되지 않습니다.
      </p>

      <h2>2. 쿠키 및 광고</h2>
      <p>
        사이트는 Google AdSense를 통해 광고를 게재합니다. Google을 포함한
        제3자 광고 사업자는 쿠키를 사용하여 이용자의 이 사이트 및 다른
        웹사이트 방문 기록을 바탕으로 맞춤 광고를 제공할 수 있습니다.
      </p>
      <ul>
        <li>
          이용자는{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 광고 설정
          </a>
          에서 맞춤 광고를 해제할 수 있습니다.
        </li>
        <li>
          Google이 정보를 사용하는 방식은{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 개인정보처리방침 및 약관
          </a>
          에서 확인할 수 있습니다.
        </li>
        <li>
          브라우저 설정에서 쿠키 저장을 거부할 수 있으며, 이 경우에도 레시피
          열람에는 지장이 없습니다.
        </li>
      </ul>

      <h2>3. 제휴 마케팅</h2>
      <p>
        사이트는 쿠팡 파트너스 활동의 일환으로 일부 상품 링크를 제공하며, 이에
        따른 일정액의 수수료를 제공받습니다. 제휴 링크를 누르면 쿠팡
        사이트로 이동하며, 이후의 개인정보 처리는 해당 서비스의 방침을
        따릅니다.
      </p>

      <h2>4. 접속 기록</h2>
      <p>
        서비스 안정성과 보안을 위해 호스팅 사업자가 IP 주소, 접속 시각,
        브라우저 정보 등 접속 기록을 자동으로 생성·보관할 수 있습니다. 이
        정보는 개인을 식별하는 용도로 사용하지 않습니다.
      </p>

      <h2>5. 방침의 변경</h2>
      <p>
        본 방침의 내용이 변경되는 경우 이 페이지를 통해 알립니다.
      </p>

      <h2>6. 문의</h2>
      <p>
        개인정보와 관련한 문의는{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 로 보내 주세요.
      </p>

      <small>시행일: {EFFECTIVE_DATE}</small>
    </div>
  );
}
