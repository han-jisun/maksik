import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_IMAGES = 24;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export interface NaverBlogBlock {
  type: "text" | "image";
  text?: string;
  /** 이미지 블록일 때의 순번 (0부터 시작) */
  imageIndex?: number;
}

export interface ParsedNaverPost {
  blogId: string;
  logNo: string;
  title: string;
  /** 로컬 저장 완료된 이미지 URL 목록 (/api/uploads/...) */
  images: string[];
  /** 본문에 등장한 순서대로 정렬된 텍스트·이미지 블록 */
  blocks: NaverBlogBlock[];
}

/** 네이버 블로그 PC / 모바일 / PostView URL 에서 blogId 와 logNo 를 추출합니다. */
export function parseNaverBlogUrl(
  rawUrl: string,
): { blogId: string; logNo: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "blog.naver.com" && host !== "m.blog.naver.com") {
    return null;
  }

  // 쿼리 파라미터 형식: /PostView.naver?blogId=...&logNo=...
  const qBlogId = parsed.searchParams.get("blogId");
  const qLogNo = parsed.searchParams.get("logNo");
  if (qBlogId && qLogNo && /^\d+$/.test(qLogNo)) {
    return { blogId: qBlogId, logNo: qLogNo };
  }

  // 경로 형식: /{blogId}/{logNo} 또는 /PostView.naver/{blogId}/{logNo}
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const logNo = segments[segments.length - 1];
    const blogId = segments[segments.length - 2];
    if (blogId && /^\d+$/.test(logNo)) {
      return { blogId, logNo };
    }
  }

  return null;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\u200B/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function getAttr(tag: string, attrName: string): string {
  const regex = new RegExp(
    `\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = regex.exec(tag);
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

/** 네이버 본문 이미지인지 판별하고 저화질 블러 쿼리를 고화질로 정규화합니다. */
function normalizeNaverImageUrl(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.startsWith("//") ? `https:${raw}` : raw;
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const isPostImage =
    host.includes("postfiles.pstatic.net") ||
    host.includes("mblogthumb-phinf.pstatic.net") ||
    host.includes("blogfiles.pstatic.net");

  if (!isPostImage) return null;

  // 스티커/이모티콘/프로필 등 제외
  const lowerPath = parsed.pathname.toLowerCase();
  if (
    lowerPath.includes("sticker") ||
    lowerPath.includes("profile") ||
    lowerPath.endsWith(".svg")
  ) {
    return null;
  }

  // w80_blur 같은 저화질 플레이스홀더를 선명한 w966 으로 교체
  if (parsed.searchParams.has("type")) {
    const typeVal = parsed.searchParams.get("type") ?? "";
    if (typeVal.includes("blur") || /^w\d{1,2}$/.test(typeVal)) {
      parsed.searchParams.set("type", "w966");
    }
  } else {
    parsed.searchParams.set("type", "w966");
  }

  return parsed.toString();
}

function extractTitle(html: string): string {
  // 1) 스마트에디터 제목 영역
  const seTitle = /class="[^"]*se-title-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(
    html,
  );
  if (seTitle) {
    const plain = decodeHtml(seTitle[1].replace(/<[^>]+>/g, " "));
    if (plain) return plain;
  }

  // 2) og:title 메타 태그
  const ogMeta = /<meta[^>]+property=["']og:title["'][^>]*>/i.exec(html);
  if (ogMeta) {
    const content = getAttr(ogMeta[0], "content");
    if (content) return content;
  }

  // 3) <title> 태그
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleTag) {
    return decodeHtml(titleTag[1]).replace(/\s*:\s*네이버\s*블로그\s*$/i, "");
  }

  return "";
}

/** 스마트에디터 ONE 또는 구형 에디터 본문 영역만 잘라냅니다. */
function extractMainHtml(html: string): string {
  const seStart = html.indexOf("se-main-container");
  if (seStart !== -1) {
    const tagStart = html.lastIndexOf("<", seStart);
    const slice = html.slice(tagStart >= 0 ? tagStart : seStart);
    // 댓글/하단 영역 전까지 자르기
    const cutMarkers = [
      'class="post_writer',
      'class="post_tag',
      'class="btn_wrap',
      'id="comment',
      'class="section_t1',
    ];
    let end = slice.length;
    for (const marker of cutMarkers) {
      const idx = slice.indexOf(marker);
      if (idx !== -1 && idx < end) end = idx;
    }
    return slice.slice(0, end);
  }

  const legacyStart = html.indexOf('id="viewTypeSelector"');
  if (legacyStart !== -1) {
    return html.slice(legacyStart);
  }

  return html;
}

async function downloadImageToLocal(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        Referer: "https://m.blog.naver.com/",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;

    const rawMime = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const ext = MIME_TO_EXT[rawMime] ?? "jpg";
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 15 * 1024 * 1024) return null;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return `/api/uploads/${filename}`;
  } catch {
    return null;
  }
}

/**
 * 네이버 블로그 공개 글을 읽어 본문 텍스트와 이미지를 순서대로 추출하고,
 * 이미지는 서버 로컬(data/uploads)에 저장합니다.
 */
export async function fetchAndParseNaverPost(
  rawUrl: string,
): Promise<ParsedNaverPost> {
  const ids = parseNaverBlogUrl(rawUrl);
  if (!ids) {
    throw new Error(
      "올바른 네이버 블로그 글 링크가 아닙니다. (예: https://blog.naver.com/아이디/글번호)",
    );
  }

  const mobileUrl = `https://m.blog.naver.com/${encodeURIComponent(ids.blogId)}/${encodeURIComponent(ids.logNo)}`;
  const response = await fetch(mobileUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `블로그 글을 불러오지 못했습니다. (HTTP ${response.status}) 전체 공개 글인지 확인해 주세요.`,
    );
  }

  const html = await response.text();
  const title = extractTitle(html);
  const mainHtml = extractMainHtml(html);

  // 본문 HTML 에서 이미지 태그와 텍스트 문단을 등장 순서대로 추출합니다.
  const tokenRegex =
    /<img\b[^>]*>|<p\b[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>[\s\S]*?<\/p>|<li\b[^>]*>[\s\S]*?<\/li>/gi;

  const rawBlocks: { type: "text" | "image"; text?: string; url?: string }[] = [];
  const seenImageKeys = new Set<string>();
  const remoteImages: string[] = [];

  for (const match of mainHtml.matchAll(tokenRegex)) {
    const token = match[0];
    if (token.toLowerCase().startsWith("<img")) {
      const candidate =
        getAttr(token, "data-lazy-src") ||
        getAttr(token, "data-src") ||
        getAttr(token, "src");
      const normalized = normalizeNaverImageUrl(candidate);
      if (!normalized) continue;

      const dedupeKey = normalized.split("?")[0];
      if (seenImageKeys.has(dedupeKey)) continue;
      if (remoteImages.length >= MAX_IMAGES) continue;

      seenImageKeys.add(dedupeKey);
      remoteImages.push(normalized);
      rawBlocks.push({ type: "image", url: normalized });
    } else {
      const plain = decodeHtml(token.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
      if (!plain) continue;
      rawBlocks.push({ type: "text", text: plain });
    }
  }

  // 만약 se-text-paragraph 가 없는 구형 에디터 글이라면 전체 텍스트를 보조 추출
  if (!rawBlocks.some((b) => b.type === "text")) {
    const fallbackText = decodeHtml(
      mainHtml
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    );
    if (fallbackText) {
      for (const line of fallbackText.split(/\n+/)) {
        const trimmed = line.trim();
        if (trimmed) rawBlocks.push({ type: "text", text: trimmed });
      }
    }
  }

  if (remoteImages.length === 0 && rawBlocks.length === 0) {
    throw new Error(
      "블로그 본문을 찾지 못했습니다. 비공개·서로이웃 공개 글은 가져올 수 없습니다.",
    );
  }

  // 이미지를 병렬로(최대 5개씩) 로컬에 저장합니다.
  const downloadedMap = new Map<string, string>();
  const concurrency = 5;
  for (let i = 0; i < remoteImages.length; i += concurrency) {
    const chunk = remoteImages.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async (imgUrl) => ({
        imgUrl,
        localUrl: await downloadImageToLocal(imgUrl),
      })),
    );
    for (const { imgUrl, localUrl } of results) {
      if (localUrl) downloadedMap.set(imgUrl, localUrl);
    }
  }

  const images: string[] = [];
  const blocks: NaverBlogBlock[] = [];

  for (const block of rawBlocks) {
    if (block.type === "image" && block.url) {
      const localUrl = downloadedMap.get(block.url);
      if (!localUrl) continue;
      const imageIndex = images.length;
      images.push(localUrl);
      blocks.push({ type: "image", imageIndex });
    } else if (block.type === "text" && block.text) {
      blocks.push({ type: "text", text: block.text });
    }
  }

  return {
    blogId: ids.blogId,
    logNo: ids.logNo,
    title,
    images,
    blocks,
  };
}
