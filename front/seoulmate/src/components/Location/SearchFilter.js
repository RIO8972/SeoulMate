// src/components/SearchFilter.jsx (또는 SearchFilter.module.jsx)
import styles from "./SearchFilter.module.css";

function SearchFilter({ keyword, onKeywordChange, selectedTag, onTagChange }) {
  const tags = ["전체", "맛집", "카페", "명소", "장바구니"]; // ← 추가

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
export default SearchFilter;