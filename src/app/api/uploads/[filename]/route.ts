import { promises as fs } from "node:fs";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const SAFE_FILENAME = /^[0-9a-f-]+\.(jpg|png|webp|gif|avif)$/;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

type Context = { params: Promise<{ filename: string }> };

/** 업로드된 레시피 이미지 서빙 */
export async function GET(_request: Request, { params }: Context) {
  const { filename } = await params;
  const match = SAFE_FILENAME.exec(filename);
  if (!match) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    const data = await fs.readFile(filePath);
    const mime = EXT_TO_MIME[match[1]] ?? "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
