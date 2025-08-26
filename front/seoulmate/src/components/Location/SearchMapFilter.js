//import  categoryPlaces  from "../../data/categoryPlaces";

function SearchMapFilter({
  keyword,
  onKeywordChange,
  selectedTag,
  onTagChange,
  regionId,
  onPreviewPins, // ← 태그 클릭 시 지도에 미리보기 마커 전달
}) {
  const tags = ["전체", "카페", "명소", "음식점"];

  return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        {tags.map((tag) => (
          <button
            key={tag}
            style={{
              marginRight: "8px",
              padding: "6px 12px",
              backgroundColor: selectedTag === tag ? "#4f46e5" : "#eee",
              color: selectedTag === tag ? "#fff" : "#000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => onTagChange(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="장소명을 입력하세요"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}

export default SearchMapFilter;
