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

  if (!enabled) return null;

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
