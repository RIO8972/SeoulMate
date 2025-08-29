function SearchMapFilter({
  keyword,
  onKeywordChange,
  selectedTag,
  onTagChange,
  regionId,
  onPreviewPins,
}) {
  const tags = ["카페", "명소", "음식점"];

  return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        {tags.map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              style={{
                marginRight: "8px",
                padding: "6px 12px",
                backgroundColor: active ? "#4f46e5" : "#eee",
                color: active ? "#fff" : "#000",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              // 같은 태그를 다시 누르면 해제(null)
              onClick={() => onTagChange(active ? null : tag)}
              aria-pressed={active}
            >
              {tag}
            </button>
          );
        })}
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
