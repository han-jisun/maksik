import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // 이미지 저장소(Cloudinary / S3 / Supabase Storage)가 확정되기 전까지는
    // 임의의 외부 URL을 받을 수 있도록 <img> 를 사용합니다.
    // 저장소 확정 후 next/image + images.remotePatterns 로 전환하고 이 규칙을 되돌려 주세요.
    rules: { "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
