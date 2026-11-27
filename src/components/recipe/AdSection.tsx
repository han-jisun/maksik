import { COUPANG_DISCLOSURE } from "@/lib/site";
import type { CoupangProduct } from "@/lib/types";
import AdSenseUnit from "./AdSenseUnit";
import styles from "./AdSection.module.scss";

/**
 * 레시피 최하단 수익화 영역.
 * 조리 과정을 방해하지 않도록 본문이 모두 끝난 뒤에만 배치합니다.
 */
export default function AdSection({ products }: { products: CoupangProduct[] }) {
  const hasAdSense = Boolean(
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT &&
      process.env.NEXT_PUBLIC_ADSENSE_SLOT,
  );
  if (products.length === 0 && !hasAdSense) return null;

  return (
    <aside className={styles.section} aria-label="추천 상품 및 광고">
      {products.length > 0 ? (
        <div className={styles.coupang}>
          <p className={styles.eyebrow}>Pantry &amp; Tools</p>
          <h2 className={styles.heading}>이 레시피에 쓴 재료 · 도구</h2>
          <ul className={styles.products}>
            {products.map((product) => (
              <li key={`${product.name}-${product.url}`}>
                <a
                  href={product.url}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  className={styles.product}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt=""
                      className={styles.thumb}
                      loading="lazy"
                    />
                  ) : null}
                  <span className={styles.name}>{product.name}</span>
                  <span className={styles.cta}>쿠팡에서 보기</span>
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.disclosure}>{COUPANG_DISCLOSURE}</p>
        </div>
      ) : null}

      <AdSenseUnit />
    </aside>
  );
}
