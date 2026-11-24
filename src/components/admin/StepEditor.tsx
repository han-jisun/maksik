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
  createStep: () => StepDraft;
}

/** 단계별 조리법 에디터: 사진 + 설명 + 팁을 Step 단위로 추가/삭제/순서 변경 */
export default function StepEditor({ steps, onChange, createStep }: Props) {
  function update(index: number, patch: Partial<StepDraft>) {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  return (
    <>
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.key} className={styles.step}>
            <div className={styles.stepHead}>
              <strong>STEP {index + 1}</strong>
              <div className={styles.stepTools}>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`${index + 1}단계를 위로 이동`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === steps.length - 1}
                  aria-label={`${index + 1}단계를 아래로 이동`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => remove(index)}
                  disabled={steps.length === 1}
                  aria-label={`${index + 1}단계 삭제`}
                >
                  삭제
                </button>
              </div>
            </div>

            <label className={styles.field}>
              <span>설명</span>
              <textarea
                rows={3}
                value={step.description}
                onChange={(e) => update(index, { description: e.target.value })}
                placeholder="이 단계에서 할 일을 적어 주세요."
              />
            </label>
            <label className={styles.field}>
              <span>사진 URL (선택)</span>
              <input
                type="url"
                value={step.imageUrl}
                onChange={(e) => update(index, { imageUrl: e.target.value })}
                placeholder="https://"
              />
            </label>
            <label className={styles.field}>
              <span>팁 (선택)</span>
              <input
                type="text"
                value={step.tip}
                onChange={(e) => update(index, { tip: e.target.value })}
              />
            </label>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className={styles.add}
        onClick={() => onChange([...steps, createStep()])}
      >
        + 단계 추가
      </button>
    </>
  );
}
