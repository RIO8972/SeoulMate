import React, { useEffect, useRef, useState } from "react";
/* global kakao */

import useSearchPlaces from "../../hooks/useSearchPlaces";
import SelectedPlacesPanel from "./SelectedPlacesPanel";
import PlaceCard from "./PlaceCard";
import SearchFilter from "./SearchFilter";
import styles from "./PlaceSelector.module.css";

function PlaceSelector({ data, setData }) {
  //props값 변경
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [previewMarkers, setPreviewMarkers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");

  const centerX = 126.978;
  const centerY = 37.5665;

  // 부모 data.places 를 사용, 값이 없으면 빈 배열
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
  }, []);

  // 2) 검색 결과에 따라 preview 마커 찍기
  useEffect(() => {
    if (!map || places.length === 0) return;
    previewMarkers.forEach((m) => m.setMap(null));

    const newMarkers = isTaggedSearch
      ? places.map(
          (place) =>
            new kakao.maps.Marker({
              position: new kakao.maps.LatLng(
                parseFloat(place.y),
                parseFloat(place.x)
              ),
              map,
              title: place.place_name,
            })
        )
      : [
          new kakao.maps.Marker({
            position: new kakao.maps.LatLng(
              parseFloat(places[0].y),
              parseFloat(places[0].x)
            ),
            map,
            title: places[0].place_name,
          }),
        ];

    setPreviewMarkers(newMarkers);
    map.setCenter(
      new kakao.maps.LatLng(parseFloat(places[0].y), parseFloat(places[0].x))
    );
  }, [places, map, selectedTag]);

  // 3) 장소 추가
  const handleAddPlace = (place) => {
    const id = place.id || `${place.x}-${place.y}`;
    // 중복 방지 (placeId 사용)
    if (selectedPlaces.some((p) => p.placeId === id)) return;

    const newPlace = {
      placeId: id, //키값 placeId 변경
      name: place.place_name || place.name,
      lat: parseFloat(place.y || place.lat),
      lng: parseFloat(place.x || place.lng),
      address: place.road_address_name || place.address_name,
      url: place.place_url,
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

  // 4) 개별 제거
  const handleRemovePlace = (placeId) => {
    console.log(placeId);
    setData((prev) => ({
      ...prev,
      places: prev.places.filter((p) => p.placeId !== placeId),
    }));

    const markerToRemove = markers.find((m) => m.placeId === placeId);
    if (markerToRemove) markerToRemove.setMap(null);
    setMarkers((prev) => prev.filter((m) => m.placeId !== placeId));
  };

  return (
    <div className={styles.wrapper}>
      {/* 왼쪽: 검색 + 결과 */}
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
              const id = place.id || `${place.x}-${place.y}`;
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

        {/* 선택된 장소 패널: 선택된 장소가 있을 때만 렌더링 */}
        {selectedPlaces.length > 0 && (
          <div className={styles.selectedPanel}>
            <SelectedPlacesPanel
              selectedPlaces={selectedPlaces}
              onRemoveAll={() => {
                setData((prev) => ({ ...prev, places: [] }));
                markers.forEach((m) => m.setMap(null));
                setMarkers([]);
              }}
              onRemove={handleRemovePlace}
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
