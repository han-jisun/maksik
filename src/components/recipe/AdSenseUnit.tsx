"use client";

import Script from "next/script";
import { useEffect } from "react";
import styles from "./AdSenseUnit.module.scss";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** 모바일 너비에 맞춰지는 반응형 디스플레이 광고 단위 */
export default function AdSenseUnit() {
  const enabled = Boolean(CLIENT && SLOT);

  useEffect(() => {
    if (!enabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 이미 채워진 광고 단위에 다시 요청하면 예외가 나므로 무시합니다.
    }
  }, [enabled]);

  if (!enabled) {
    // 애드센스 승인 전: 환경 변수를 설정하기 전까지는 개발 중에만 자리 표시를 보여 줍니다.
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div className={styles.placeholder}>
        광고 영역 (NEXT_PUBLIC_ADSENSE_CLIENT / SLOT 설정 시 노출)
      </div>
    );
  }

  return (
    <div className={styles.unit}>
      <Script
        id="adsbygoogle-js"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
