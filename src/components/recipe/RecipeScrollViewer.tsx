import type { CategoryId, RecipeStep } from "@/lib/types";
import RecipeImage from "./RecipeImage";
import styles from "./RecipeScrollViewer.module.scss";

interface Props {
  steps: RecipeStep[];
  category: CategoryId;
}

/** 한 페이지 스크롤 뷰어: 모든 단계를 세로로 나열합니다. */
export default function RecipeScrollViewer({ steps, category }: Props) {
  return (
    <ol className={styles.list}>
      {steps.map((step) => (
        <li
          key={step.stepNumber}
          id={`step-${step.stepNumber}`}
          className={styles.step}
        >
          <span className={styles.number} aria-hidden="true">
            {String(step.stepNumber).padStart(2, "0")}
          </span>
          <div className={styles.body}>
            {step.imageUrl ? (
              <RecipeImage
                src={step.imageUrl}
                alt={`${step.stepNumber}단계 사진`}
                category={category}
                className={styles.image}
              />
            ) : null}
            <p className={styles.description}>{step.description}</p>
            {step.tip ? (
              <p className={styles.tip}>
                <strong>TIP</strong>
                {step.tip}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
