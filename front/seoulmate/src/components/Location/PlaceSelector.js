import React, { useEffect, useRef, useState } from "react";
/* global kakao */

import useSearchPlaces from "../../hooks/useSearchPlaces";
import SelectedPlacesPanel from "./SelectedPlacesPanel";
import PlaceCard from "./PlaceCard";
import SearchFilter from "./SearchFilter";
import styles from "./PlaceSelector.module.css";

function PlaceSelector({ data, setData }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [previewMarkers, setPreviewMarkers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");

  const centerX = 126.978;
  const centerY = 37.5665;

  // 부모에서 관리하는 선택된 장소
  const selectedPlaces = data.places || [];

  const isTaggedSearch = selectedTag && selectedTag !== "전체";
  const searchQuery =
    keyword.trim() + (isTaggedSearch ? ` ${selectedTag}` : "");
  const places = useSearchPlaces(searchQuery);

  // 1) 지도 초기화
  useEffect(() => {
    if (!window.kakao?.maps) return;
    const mapInstance = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerY, centerX),
      level: 5,
    });
    setMap(mapInstance);

    // 언마운트 시 마커 정리
    return () => {
      markers.forEach((m) => m.setMap && m.setMap(null));
      previewMarkers.forEach((m) => m.setMap && m.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) 검색 결과에 따라 preview 마커 갱신
  useEffect(() => {
    if (!map) return;

    // 이전 미리보기 마커 삭제
    previewMarkers.forEach((m) => m.setMap(null));

    if (!places || places.length === 0) {
      setPreviewMarkers([]);
      return;
    }

    // 태그 검색이면 결과 전체, 아니면 첫 결과만
    const nextPreview = (isTaggedSearch ? places : [places[0]]).map((place) => {
      const mk = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(
          parseFloat(place.y),
          parseFloat(place.x)
        ),
        map,
        title: place.place_name,
      });
      return mk;
    });

    setPreviewMarkers(nextPreview);

    // 중심 이동
    const first = places[0];
    map.setCenter(
      new kakao.maps.LatLng(parseFloat(first.y), parseFloat(first.x))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, map, isTaggedSearch]);

  // 3) 장소 추가
  const handleAddPlace = (place) => {
    const id = String(place.id || `${place.x}-${place.y}`);
    if (selectedPlaces.some((p) => (p.placeId ?? p.id) === id)) return;

    const newPlace = {
      placeId: id, // ✅ 고유 키 보장
      name: place.place_name || place.name || "",
      lat: parseFloat(place.y || place.lat) || 0,
      lng: parseFloat(place.x || place.lng) || 0,
      address: place.road_address_name || place.address_name || "",
      url: place.place_url || place.url || "",
      category: place.category_group_name || place.category || "",
      stay: place.stay || "",
    };

    setData((prev) => ({
      ...prev,
      places: [...(prev.places || []), newPlace],
    }));

    if (map) {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(newPlace.lat, newPlace.lng),
        map,
      });
      marker.placeId = id;
      setMarkers((prev) => [...prev, marker]);
      map.panTo(marker.getPosition());
    }
  };

  // 4) 개별 제거 (id/ placeId 모두 허용)
  const handleRemovePlace = (idOrPlaceId) => {
    setData((prev) => ({
      ...prev,
      places: (prev.places || []).filter(
        (p) => (p.placeId ?? p.id) !== idOrPlaceId
      ),
    }));

    const markerToRemove = markers.find(
      (m) => (m.placeId ?? m.id) === idOrPlaceId
    );
    if (markerToRemove) markerToRemove.setMap(null);
    setMarkers((prev) =>
      prev.filter((m) => (m.placeId ?? m.id) !== idOrPlaceId)
    );
  };

  // 5) 전체 제거
  const handleRemoveAll = () => {
    setData((prev) => ({ ...prev, places: [] }));
    markers.forEach((m) => m.setMap(null));
    setMarkers([]);
  };

  // 6) 정렬 변경(dnd) 반영
  const handleReorder = (newList) => {
    setData((prev) => ({ ...prev, places: newList }));
  };

  return (
    <div className={styles.wrapper}>
      {/* 왼쪽: 검색 + 결과 + 선택 패널 */}
      <div className={styles.leftPanel}>
        <div className={styles.searchPanel}>
          <h2 className="review-title">장소 추가</h2>
          <p className="review-subtitle">
            데이트 코스에 포함된 장소를 선택해주세요
          </p>

          <SearchFilter
            keyword={keyword}
            onKeywordChange={setKeyword}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
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
                  onAdd={handleAddPlace}
                />
              );
            })}
          </div>
        </div>

        {/* 선택된 장소 패널 */}
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

      {/* 오른쪽: 지도 */}
      <div className={styles.mapPanel}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

export default PlaceSelector;
