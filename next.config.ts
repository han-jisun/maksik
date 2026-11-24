import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  sassOptions: {
    // `@use "variables" as *;` / `@use "mixins" as *;` 로 바로 불러올 수 있게 합니다.
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
