import type { CategoryId } from "@/lib/types";
import styles from "./RecipeImage.module.scss";

interface Props {
  src: string;
  alt: string;
  category?: CategoryId;
  /** 가로:세로 비율 */
  ratio?: "4/3" | "1/1" | "16/9" | "4/5";
  priority?: boolean;
  className?: string;
}

/**
 * 레시피 사진. 이미지 저장소가 확정되지 않아 임의의 외부 URL을 받을 수 있도록
 * next/image 대신 <img> 를 사용하고, 사진이 없으면 자리 표시를 보여 줍니다.
 */
export default function RecipeImage({
  src,
  alt,
  category,
  ratio = "4/3",
  priority,
  className,
}: Props) {
  const classes = [styles.frame, category ? styles[category] : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={{ aspectRatio: ratio }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={styles.image}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
      ) : (
        <span className={styles.placeholder} role="img" aria-label={alt}>
          <span aria-hidden="true">사진 준비 중</span>
        </span>
      )}
    </div>
  );
}
