import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { guardAdmin } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** 관리자 이미지 파일 업로드 (data/uploads 저장 후 서빙 URL 반환) */
export async function POST(request: Request) {
  const denied = await guardAdmin(request);
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "업로드 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "이미지 파일을 선택해 주세요." }, { status: 400 });
  }

  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return Response.json(
      { error: "JPG, PNG, WEBP, GIF, AVIF 이미지만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json(
      { error: "이미지 크기는 10MB 이하만 가능합니다." },
      { status: 400 },
    );
  }

  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return Response.json({ url: `/api/uploads/${filename}` }, { status: 201 });
}
