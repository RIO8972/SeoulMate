import "../../ReviewForm/style.css";
import styles from "./StepCategory.module.css";

const categories = [
  { label: "맛집", icon: "eat.png" },
  { label: "음식점", icon: "restaurant.png" },
  { label: "카페", icon: "cafe.png" },
  { label: "디저트", icon: "dessert.png" },
  { label: "자연", icon: "leaves.png" },
  { label: "산책", icon: "walk.png" },
  { label: "야경", icon: "night.png" },
  { label: "감성", icon: "vibe.png" },
  { label: "명소", icon: "spot.png" },
  { label: "힐링", icon: "healing.png" },
  { label: "쇼핑", icon: "shopping.png" },
  { label: "실내", icon: "indoor.png" },
  { label: "전시", icon: "exhibition.png" },
  { label: "팝업", icon: "popup.png" },
  { label: "공연", icon: "show.png" },
  { label: "영화관", icon: "movie.png" },
  { label: "액티비티", icon: "activity.png" },
  { label: "드라이브", icon: "drive.png" },
];

function StepCategory({ data, setData, next }) {
  const toggleCategory = (category) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  return (
    <div className="review-container">
      <h2 className="review-title">데이트 코스 리뷰</h2>
      <p className="review-subtitle">
        방문했던 각 장소들의 카테고리를 선택해주세요
      </p>

      <div className={styles["category-grid"]}>
        {categories.map(({ label, icon }) => (
          <button
            key={label}
            className={`${styles["category-button"]} ${
              data.categories.includes(label) ? styles.selected : ""
            }`}
            onClick={() => toggleCategory(label)}
          >
            <img
              src={`/icons/${icon}`}
              alt={label}
              className={styles["category-icon"]}
            />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default StepCategory;
