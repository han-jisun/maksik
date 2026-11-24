"use client";

import { useRef, useState } from "react";
import styles from "./RecipeEditor.module.scss";

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** 업로드 영역 안내 문구 */
  placeholder?: string;
  /** 미리보기 비율 */
  ratio?: "16/9" | "4/3" | "1/1";
  ariaLabel: string;
}

/** 클릭 또는 드래그앤드롭으로 이미지를 업로드하고 미리보기를 표시합니다. */
export default function ImageField({
  value,
  onChange,
  placeholder = "클릭하거나 이미지를 끌어다 놓으세요",
  ratio = "16/9",
  ariaLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) {
        setError(data?.error ?? "이미지 업로드에 실패했습니다.");
      } else {
        onChange(data.url);
      }
    } catch {
      setError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div
      className={`${styles.imageField} ${ratio === "1/1" ? styles.imageFieldSquare : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileChange}
        className={styles.hiddenFile}
        aria-label={ariaLabel}
      />

      {value ? (
        <div className={styles.previewWrap} style={{ aspectRatio: ratio }}>
          <img src={value} alt={ariaLabel} className={styles.previewImg} />
          <div className={styles.previewActions}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "업로드 중…" : "이미지 변경"}
            </button>
            <button
              type="button"
              className={styles.previewRemove}
              onClick={() => onChange("")}
              disabled={uploading}
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
          style={{ aspectRatio: ratio }}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 15-5-5L5 19" />
          </svg>
          <span>{uploading ? "이미지 업로드 중…" : placeholder}</span>
          <small>JPG · PNG · WEBP · GIF (최대 10MB)</small>
        </div>
      )}

      <div className={styles.urlToggleRow}>
        <button
          type="button"
          className={styles.urlToggle}
          onClick={() => setShowUrl((prev) => !prev)}
        >
          {showUrl ? "URL 입력 닫기" : "또는 이미지 URL 직접 입력"}
        </button>
      </div>

      {showUrl ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          aria-label={`${ariaLabel} URL`}
          className={styles.urlInput}
        />
      ) : null}

      {error ? (
        <p className={styles.inlineError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
