"use client";

import { useEffect, useRef, useState } from "react";
import ImageField from "./ImageField";
import styles from "./RecipeEditor.module.scss";

export interface StepDraft {
  key: string;
  imageUrl: string;
  description: string;
  tip: string;
}

interface Props {
  steps: StepDraft[];
  onChange: (steps: StepDraft[]) => void;
  createStep: (initial?: Partial<Omit<StepDraft, "key">>) => StepDraft;
  /** 현재 레시피의 대표 썸네일 URL */
  thumbnailUrl: string;
  /** 카드 상세에서 썸네일로 설정/해제할 때 호출 */
  onSelectThumbnail: (url: string) => void;
}

/**
 * 3x3 그리드 기반 카드 에디터:
 * - 이미지를 여러 장 올려 3열로 촤르륵 배치합니다.
 * - 카드를 드래그앤드롭해 순서를 바꿀 수 있습니다.
 * - 카드를 클릭하면 큰 이미지와 함께 설명·팁·썸네일 설정을 입력하는 레이어가 열립니다.
 */
export default function StepEditor({
  steps,
  onChange,
  createStep,
  thumbnailUrl,
  onSelectThumbnail,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [fileDropping, setFileDropping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState("");

  const editingStep =
    editingIndex !== null && editingIndex >= 0 && editingIndex < steps.length
      ? steps[editingIndex]
      : null;

  // 레이어가 열려 있을 때 ESC 닫기 및 배경 스크롤 잠금
  useEffect(() => {
    if (editingIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditingIndex(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editingIndex]);

  function update(index: number, patch: Partial<StepDraft>) {
    const prevImage = steps[index]?.imageUrl;
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    // 현재 썸네일로 지정된 카드의 이미지가 바뀌거나 삭제되면 썸네일도 함께 갱신합니다.
    if (
      patch.imageUrl !== undefined &&
      prevImage &&
      thumbnailUrl === prevImage
    ) {
      onSelectThumbnail(patch.imageUrl);
    }
  }

  function remove(index: number) {
    const removedImage = steps[index]?.imageUrl;
    const next = steps.filter((_, i) => i !== index);
    onChange(next);
    if (removedImage && thumbnailUrl === removedImage) {
      onSelectThumbnail("");
    }
    if (editingIndex === null) return;
    if (next.length === 0) {
      setEditingIndex(null);
    } else if (editingIndex === index) {
      setEditingIndex(Math.min(index, next.length - 1));
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= steps.length || to >= steps.length) {
      return;
    }
    const next = [...steps];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0) return;

    setUploadError("");
    setUploadProgress({ done: 0, total: files.length });

    const created: StepDraft[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.url) {
          created.push(createStep({ imageUrl: data.url }));
        } else {
          errors.push(data?.error ?? `${files[i].name} 업로드 실패`);
        }
      } catch {
        errors.push(`${files[i].name} 업로드 실패`);
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }

    if (created.length > 0) {
      onChange([...steps, ...created]);
    }
    if (errors.length > 0) {
      setUploadError(errors[0]);
    }
    setUploadProgress(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      void uploadFiles(files);
    }
    event.target.value = "";
  }

  function handleGridDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (dragIndex !== null) return;
    if (event.dataTransfer.types.includes("Files")) {
      event.preventDefault();
      setFileDropping(true);
    }
  }

  function handleGridDrop(event: React.DragEvent<HTMLDivElement>) {
    if (dragIndex !== null) return;
    if (event.dataTransfer.files?.length > 0) {
      event.preventDefault();
      setFileDropping(false);
      void uploadFiles(event.dataTransfer.files);
    }
  }

  function addBlankCard() {
    const next = [...steps, createStep()];
    onChange(next);
    setEditingIndex(next.length - 1);
  }

  return (
    <div
      className={`${styles.photoGridWrap} ${fileDropping ? styles.photoGridDropping : ""}`}
      onDragOver={handleGridDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFileDropping(false);
        }
      }}
      onDrop={handleGridDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        onChange={handleFileChange}
        className={styles.hiddenFile}
        aria-label="레시피 카드 이미지 여러 장 추가"
      />

      <ol className={styles.photoGrid}>
        {steps.map((step, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          const hasText = Boolean(step.description.trim() || step.tip.trim());
          const isThumbnail = Boolean(step.imageUrl && thumbnailUrl === step.imageUrl);

          return (
            <li
              key={step.key}
              className={`${styles.photoTile} ${isDragging ? styles.photoTileDragging : ""} ${
                isOver ? styles.photoTileOver : ""
              }`}
              draggable
              onDragStart={(event) => {
                setDragIndex(index);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => {
                if (dragIndex === null) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (overIndex !== index) setOverIndex(index);
              }}
              onDrop={(event) => {
                if (dragIndex === null) return;
                event.preventDefault();
                event.stopPropagation();
                reorder(dragIndex, index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
            >
              <button
                type="button"
                className={styles.photoTileButton}
                onClick={() => setEditingIndex(index)}
                aria-label={`카드 ${index + 1} 상세 편집`}
              >
                {step.imageUrl ? (
                  <img
                    src={step.imageUrl}
                    alt={`카드 ${index + 1} 이미지`}
                    className={styles.photoTileImg}
                    draggable={false}
                  />
                ) : (
                  <div className={styles.photoTileEmpty}>
                    <span>
                      {step.description.trim() || "이미지 없음 · 눌러서 입력"}
                    </span>
                  </div>
                )}

                <span className={styles.photoTileBadge}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                {isThumbnail ? (
                  <span className={styles.photoTileThumb}>썸네일</span>
                ) : null}

                {hasText ? (
                  <span
                    className={styles.photoTileHasText}
                    title="설명 입력됨"
                    aria-label="설명 입력됨"
                  >
                    글
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                className={styles.photoTileDelete}
                onClick={(event) => {
                  event.stopPropagation();
                  remove(index);
                }}
                aria-label={`카드 ${index + 1} 삭제`}
              >
                ✕
              </button>
            </li>
          );
        })}

        <li className={styles.photoTileAddWrap}>
          <button
            type="button"
            className={styles.photoTileAdd}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>
              {uploadProgress
                ? `업로드 ${uploadProgress.done}/${uploadProgress.total}`
                : "사진 추가"}
            </span>
          </button>
        </li>
      </ol>

      <div className={styles.photoGridFoot}>
        <p className={styles.photoGridHint}>
          사진을 끌어 순서를 바꾸고, 눌러서 설명과 팁을 적어 보세요.
        </p>
        <button
          type="button"
          className={styles.urlToggle}
          onClick={addBlankCard}
        >
          + 이미지 없이 텍스트 카드 추가
        </button>
      </div>

      {uploadError ? (
        <p className={styles.inlineError} role="alert">
          {uploadError}
        </p>
      ) : null}

      {/* ---------- 카드 상세 입력 레이어 (모달) ---------- */}
      {editingStep && editingIndex !== null ? (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label={`카드 ${editingIndex + 1} 편집`}
          onClick={() => setEditingIndex(null)}
        >
          <div
            className={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <strong className={styles.cardNumber}>
                  카드 {String(editingIndex + 1).padStart(2, "0")} /{" "}
                  {String(steps.length).padStart(2, "0")}
                </strong>
                <div className={styles.modalNav}>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(editingIndex - 1)}
                    disabled={editingIndex === 0}
                    aria-label="이전 카드"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(editingIndex + 1)}
                    disabled={editingIndex === steps.length - 1}
                    aria-label="다음 카드"
                  >
                    →
                  </button>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setEditingIndex(null)}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalImageArea}>
                <ImageField
                  value={editingStep.imageUrl}
                  onChange={(imageUrl) => update(editingIndex, { imageUrl })}
                  placeholder="이미지를 선택하거나 끌어다 놓으세요"
                  ratio="4/3"
                  ariaLabel={`카드 ${editingIndex + 1} 이미지`}
                />
                {editingStep.imageUrl ? (
                  <label className={styles.thumbCheck}>
                    <input
                      type="checkbox"
                      checked={thumbnailUrl === editingStep.imageUrl}
                      onChange={(e) =>
                        onSelectThumbnail(
                          e.target.checked ? editingStep.imageUrl : "",
                        )
                      }
                    />
                    <span>이 이미지를 대표 썸네일로 설정</span>
                  </label>
                ) : null}
              </div>

              <label className={styles.field}>
                <span>설명</span>
                <textarea
                  rows={4}
                  value={editingStep.description}
                  onChange={(e) =>
                    update(editingIndex, { description: e.target.value })
                  }
                  placeholder="이 단계의 조리 설명을 적어 주세요."
                />
              </label>

              <label className={styles.field}>
                <span>팁 (선택)</span>
                <input
                  type="text"
                  value={editingStep.tip}
                  onChange={(e) => update(editingIndex, { tip: e.target.value })}
                  placeholder="불 세기나 맛을 살리는 팁이 있다면 적어 주세요."
                />
              </label>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(editingIndex)}
              >
                이 카드 삭제
              </button>
              <button
                type="button"
                className={styles.modalDone}
                onClick={() => setEditingIndex(null)}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
