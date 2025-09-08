import CategoryPicker from "../../../components/CategoryPicker";

const CATEGORIES = [
  { label: "맛집", icon: "🌟" },
  { label: "음식점", icon: "🍽️" },
  { label: "카페", icon: "☕" },
  { label: "디저트", icon: "🍰" },
  { label: "자연", icon: "🌲" },
  { label: "산책", icon: "🚶🏻‍♂️" },
  { label: "야경", icon: "🌃" },
  { label: "감성", icon: "✨" },
  { label: "명소", icon: "📍" },
  { label: "힐링", icon: "🍵" },
  { label: "쇼핑", icon: "🛍️" },
  { label: "실내", icon: "🛋️" },
  { label: "전시", icon: "🖼️" },
  { label: "팝업", icon: "🏬" },
  { label: "공연", icon: "🎫" },
  { label: "영화관", icon: "🎞️" },
  { label: "액티비티", icon: "🎯" },
  { label: "드라이브", icon: "🚗" },
];

const buildKeyword = (cats) =>
  (Array.isArray(cats) ? cats : []).filter(Boolean).join(" · ");

export default function StepCategory({ data, setData, next, max = 3 }) {
  const selected = Array.isArray(data?.categories) ? data.categories : [];
  const onChange = (nextCats) =>
    setData((prev) => ({
      ...prev,
      categories: nextCats,
      keyword: buildKeyword(nextCats),
    }));

  return (
    <>
      <h2 className="review-title">데이트 리뷰 카테고리</h2>
      <p className="review-subtitle">방문했던 장소의 카테고리를 선택해주세요</p>

      <CategoryPicker
        items={CATEGORIES}
        selected={selected}
        onChange={onChange}
        max={max}
        columns={3}
        colGap={8}
        rowGap={12}
        buttonMinH={96}
        emojiSize={30}
      />

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
          {selected.length
            ? `# ${buildKeyword(selected)}`
            : "카테고리를 선택하면 키워드가 자동으로 생성됩니다"}
        </span>
      </div>

      {typeof next === "function" && (
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button
            className="review-button next"
            disabled={!selected.length}
            onClick={next}
          >
            다음
          </button>
        </div>
      )}
    </>
  );
}
