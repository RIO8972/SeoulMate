// src/components/Location/PlaceMapSelector.jsx
import React, { useState, useEffect } from "react";
import useMapSearchPlaces from "../../hooks/useMapSearchPlaces";
import SelectedPlacesPanel from "./SelectedPlacesPanel";
import PlaceCard from "./PlaceCard";
import SearchMapFilter from "./SearchMapFilter"; // ✅ 변경
import styles from "./PlaceMapSelector.module.css";

function PlaceMapSelector({ data, setData, regionKeyword, regionId, onPreviewPins }) {
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const [page, setPage] = useState(1);
  const size = 15;

  const selectedPlaces = data.places || [];
  const isTaggedSearch = selectedTag && selectedTag !== "전체";

  // "강남구 카페 #디저트" 형태로 안전하게 결합 (검색창은 기존 API 사용)
  const searchTerm = [regionKeyword?.trim(), keyword.trim(), isTaggedSearch ? selectedTag : null]
    .filter(Boolean)
    .join(" ");

  // 검색어 바뀌면 페이지 리셋
  useEffect(() => { setPage(1); }, [searchTerm]);

  const { places, hasMore, loading } = useMapSearchPlaces(searchTerm, page, size);

  const handleAddPlace = (place) => {
    const id = String(place.id || `${place.x}-${place.y}`);
    if (selectedPlaces.some((p) => (p.placeId ?? p.id) === id)) return;

    const newPlace = {
      placeId: id,
      name: place.place_name || place.name || "",
      lat: parseFloat(place.y || place.lat) || 0,
      lng: parseFloat(place.x || place.lng) || 0,
      address: place.road_address_name || place.address_name || "",
      url: place.place_url || place.url || "",
      category: place.category_group_name || place.category || "",
      stay: place.stay || "",
    };

    setData((prev) => ({ ...prev, places: [...(prev.places || []), newPlace] }));
  };

  const handleRemovePlace = (idOrPlaceId) => {
    setData((prev) => ({
      ...prev,
      places: (prev.places || []).filter((p) => (p.placeId ?? p.id) !== idOrPlaceId),
    }));
  };

  const handleRemoveAll = () => setData((prev) => ({ ...prev, places: [] }));
  const handleReorder = (newList) => setData((prev) => ({ ...prev, places: newList }));

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftPanel}>
        <div className={styles.searchPanel}>
          <h2 className="review-title">장소 검색</h2>
          <p className="review-subtitle">데이트 코스에 포함된 장소를 선택해주세요</p>

          <SearchMapFilter
            keyword={keyword}
            onKeywordChange={setKeyword}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            regionId={regionId}
            onPreviewPins={onPreviewPins}     // ✅ 태그 → 미리보기 마커 목록
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
                  }}
                  onAdd={() => handleAddPlace(place)}
                />
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || loading}
            >
              {loading ? "불러오는 중..." : hasMore ? "장소 더보기" : "더 불러올 결과 없음"}
            </button>
          </div>
        </div>

        {selectedPlaces.length > 0 && (
          <div className={styles.selectedPanel}>
            <SelectedPlacesPanel
              selectedPlaces={selectedPlaces}
              onRemoveAll={handleRemoveAll}
              onRemove={handleRemovePlace}
              onReorder={handleReorder}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaceMapSelector;
