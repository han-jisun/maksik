import {
  Avocado,
  Carrot,
  Chili,
  DoodleDefs,
  Lemon,
  Onion,
  Plate,
  Tomato,
} from "@/components/common/Doodles";
import SearchBar from "@/components/common/SearchBar";
import HomeRecipes from "@/components/recipe/HomeRecipes";
import { toSummary } from "@/components/recipe/RecipeList";
import { getPublishedRecipes } from "@/lib/recipes";
import styles from "./page.module.scss";

export default async function HomePage() {
  const recipes = (await getPublishedRecipes()).map(toSummary);

  return (
    <>
      {/* 요리책 표지: 접시 안에 제목, 둘레에 손그림 */}
      <section className={styles.cover}>
        <DoodleDefs />
        <Tomato className={`${styles.art} ${styles.topLeft}`} />
        <Carrot className={`${styles.art} ${styles.topRight}`} />
        <Lemon className={`${styles.art} ${styles.midRight}`} />
        <Chili className={`${styles.art} ${styles.bottomLeft}`} />
        <Avocado className={`${styles.art} ${styles.bottomRight}`} />
        <Onion className={`${styles.art} ${styles.midLeft}`} />

        <div className={styles.plate}>
          <Plate className={styles.plateArt} />
          <div className={styles.plateText}>
            <p className={styles.eyebrow}>Maksik&rsquo;s Cookbook</p>
            <h1 className={styles.title}>
              막식가의
              <br />
              레시피
            </h1>
          </div>
        </div>
      </section>
      <div className={styles.search}>
        <SearchBar />
      </div>
      <HomeRecipes recipes={recipes} />
    </>
  );
}
