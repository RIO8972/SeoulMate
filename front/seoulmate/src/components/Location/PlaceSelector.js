import React, { useEffect, useRef, useState } from "react";
/* global kakao */

import useSearchPlaces from "../../hooks/useSearchPlaces";
import SelectedPlacesPanel from "./SelectedPlacesPanel";
import PlaceCard from "./PlaceCard";
import SearchFilter from "./SearchFilter";
import styles from "./PlaceSelector.module.css";

function PlaceSelector({ selectedPlaces, setSelectedPlaces }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [previewMarkers, setPreviewMarkers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");

  const centerX = 126.978;
  const centerY = 37.5665;

  const isTaggedSearch = selectedTag && selectedTag !== "전체";
  const searchQuery =
    keyword.trim() + (isTaggedSearch ? ` ${selectedTag}` : "");
  const places = useSearchPlaces(searchQuery);

  // 지도 생성
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const mapInstance = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerY, centerX),
      level: 5,
    });

    setMap(mapInstance);
  }, []);

  // 검색 결과 마커
  useEffect(() => {
    if (!map || places.length === 0) return;

    previewMarkers.forEach((marker) => marker.setMap(null));

    let newMarkers = [];

    if (isTaggedSearch) {
      newMarkers = places.map((place) => {
        const position = new kakao.maps.LatLng(
          parseFloat(place.y),
          parseFloat(place.x)
        );
        return new kakao.maps.Marker({
          position,
          map,
          title: place.place_name,
        });
      });
    } else {
      const first = places[0];
      const position = new kakao.maps.LatLng(
        parseFloat(first.y),
        parseFloat(first.x)
      );
      newMarkers = [
        new kakao.maps.Marker({ position, map, title: first.place_name }),
      ];
    }

    setPreviewMarkers(newMarkers);
    map.setCenter(
      new kakao.maps.LatLng(parseFloat(places[0].y), parseFloat(places[0].x))
    );
  }, [places, map, selectedTag]);

  // 장소 추가
  const handleAddPlace = (place) => {
    const id = place.id || `${place.x}-${place.y}`;
    if (selectedPlaces.find((p) => p.id === id)) return;

    const newPlace = {
      id,
      name: place.place_name || place.name,
      lat: parseFloat(place.y || place.lat),
      lng: parseFloat(place.x || place.lng),
      address: place.road_address_name || place.address_name,
      url: place.place_url,
    };

    setSelectedPlaces((prev) => [...prev, newPlace]);

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

  const handleRemovePlace = (placeId) => {
    setSelectedPlaces((prev) => prev.filter((p) => p.id !== placeId));

    const markerToRemove = markers.find((m) => m.placeId === placeId);
    if (markerToRemove) markerToRemove.setMap(null);

    setMarkers((prev) => prev.filter((m) => m.placeId !== placeId));
  };

  return (
    <div className={styles.wrapper}>
      {/* 왼쪽 패널: 검색 + 선택된 장소를 가로로 */}
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
              const lat = parseFloat(place.y);
              const lng = parseFloat(place.x);
              const address = place.road_address_name || place.address_name;

              return (
                <PlaceCard
                  key={id}
                  place={{
                    id,
                    name: place.place_name,
                    lat,
                    lng,
                    address,
                    url: place.place_url,
                  }}
                  onAdd={handleAddPlace}
                />
              );
            })}
          </div>
        </div>

        <div className={styles.selectedPanel}>
          <SelectedPlacesPanel
            selectedPlaces={selectedPlaces}
            onRemoveAll={() => {
              setSelectedPlaces([]);
              markers.forEach((marker) => marker.setMap(null));
              setMarkers([]);
            }}
            onRemove={handleRemovePlace}
          />
        </div>
      </div>

      {/* 오른쪽 패널: 지도 */}
      <div className={styles.mapPanel}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

export default PlaceSelector;
