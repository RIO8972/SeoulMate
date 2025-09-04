import styles from "./CourseCategory.module.css";

const CATEGORIES = [
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

// 카테고리 → 키워드 문자열 (예: "맛집 · 디저트")
const buildKeyword = (cats) =>
  (Array.isArray(cats) ? cats : []).filter(Boolean).join(" · ");

function CourseCategory({ data, setData, next, max = 3 }) {
  const selected = Array.isArray(data?.categories) ? data.categories : [];

  const toggleCategory = (label) => {
    setData((prev) => {
      const cur = Array.isArray(prev.categories) ? prev.categories : [];
      const exists = cur.includes(label);

      // 해제
      if (exists) {
        const nextCats = cur.filter((c) => c !== label);
        return {
          ...prev,
          categories: nextCats,
          keyword: buildKeyword(nextCats),
        };
      }

      // 선택 (최대 개수 제한)
      if (cur.length >= max) {
        alert(`카테고리는 최대 ${max}개까지 선택할 수 있어요.`);
        return prev;
      }

      const nextCats = [...cur, label];
      return { ...prev, categories: nextCats, keyword: buildKeyword(nextCats) };
    });
  };

  const hasSelection = selected.length > 0;

  return (
    <div className="review-container">
      <h2 className="review-title">데이트 코스 카테고리</h2>
      <p className="review-subtitle">
        데이트 카테고리
      </p>

      <div className={styles["category-grid"]} role="list">
        {CATEGORIES.map(({ label, icon }) => {
          const isActive = selected.includes(label);
          return (
            <button
              key={label}
              type="button"
              role="listitem"
              className={`${styles["category-button"]} ${
                isActive ? styles.selected : ""
              }`}
              onClick={() => toggleCategory(label)}
              aria-pressed={isActive}
              aria-label={`${label} ${isActive ? "선택됨" : "선택"}`}
            >
              <img
                src={`/icons/${icon}`}
                alt={label}
                className={styles["category-icon"]}
                loading="lazy"
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 상태 요약 */}
      <div
        style={{
          marginTop: 12,
          color: "#555",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <span>
          선택 {selected.length}/{max}
        </span>
        <span style={{ color: "#6b7280" }}>
          {hasSelection
            ? `# ${buildKeyword(selected)}`
            : "카테고리를 선택하면 키워드가 자동으로 생성돼요"}
        </span>
      </div>

      {/* 다음 단계로 이동 버튼이 이 스텝에 있다면(선택) */}
      {typeof next === "function" && (
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button
            type="button"
            className="review-button next"
            onClick={next}
            disabled={!hasSelection}
            aria-disabled={!hasSelection}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default CourseCategory;
