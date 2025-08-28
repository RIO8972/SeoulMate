// src/components/Location/PlaceMapSelector.jsx
import React, { useState, useEffect } from "react";
import useMapSearchPlaces from "../../hooks/useMapSearchPlaces";
import PlaceCard from "./PlaceCard";
import SearchMapFilter from "./SearchMapFilter";
import styles from "./PlaceMapSelector.module.css";

function PlaceMapSelector({
  data,
  setData,
  regionKeyword,
  regionId,
  onPreviewPins,
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const [page, setPage] = useState(1);
  const size = 15;

  // ✅ 찜 상태 (이 화면 전용)
  const [wishIds, setWishIds] = useState(new Set());
  const toggleWishlist = (place, next) => {
    const id = String(place.id);
    setWishIds((prev) => {
      const s = new Set(prev);
      next ? s.add(id) : s.delete(id);
      return s;
    });
    // TODO: 필요 시 서버 연동 (POST/DELETE /wishlist/:id)
  };

  const isTaggedSearch = selectedTag && selectedTag !== "전체";
  const searchTerm = [
    regionKeyword?.trim(),
    keyword.trim(),
    isTaggedSearch ? selectedTag : null,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const { places, hasMore, loading } = useMapSearchPlaces(
    searchTerm,
    page,
    size
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftPanel}>
        <div className={styles.searchPanel}>
          <h2 className="review-title">장소 검색</h2>
          <p className="review-subtitle">관심 있는 장소를 찜해 보세요</p>

          <SearchMapFilter
            keyword={keyword}
            onKeywordChange={setKeyword}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            regionId={regionId}
            onPreviewPins={onPreviewPins}
          />

          <div className={styles.resultList}>
            <h4>장소 검색 결과</h4>
            {places.map((place) => {
              const id = String(place.id || `${place.x}-${place.y}`);
              return (
                <PlaceCard
                  key={id}
                  place={{
                    id,
                    name: place.place_name,
                    lat: parseFloat(place.y),
                    lng: parseFloat(place.x),
                    address: place.road_address_name || place.address_name,
                    url: place.place_url,
                    category:
                      place.category_group_name ||
                      place.category_name ||
                      place.category ||
                      "",
                  }}
                  /* ⬇️ 이 화면에서는 찜 버튼만 보이게 */
                  mode="browse"
                  isWishlisted={wishIds.has(id)}
                  onToggleWishlist={toggleWishlist}
                />
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || loading}
            >
              {loading
                ? "불러오는 중..."
                : hasMore
                ? "장소 더보기"
                : "더 불러올 결과 없음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceMapSelector;
