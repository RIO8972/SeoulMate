import React, { useEffect, useRef, useState } from "react";
/* global kakao */
import useSearchPlaces from "../../../hooks/useSearchPlaces";
import SelectedPlaces from "../../../components/Location/SelectedPlaces";
import PlaceCard from "../../../components/Location/PlaceCard";
import SearchFilter from "../../../components/Location/SearchFilter";

function StepLocation({ data, setData }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
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

  // 마커 자동 표시 로직
  useEffect(() => {
    if (!map || places.length === 0) return;

    previewMarkers.forEach((marker) => marker.setMap(null));

    let newMarkers = [];

    if (isTaggedSearch) {
      // 태그 포함 시 → 전체 마커 표시
      newMarkers = places.map((place) => {
        const lat = parseFloat(place.y);
        const lng = parseFloat(place.x);
        const position = new kakao.maps.LatLng(lat, lng);

        return new kakao.maps.Marker({
          position,
          map,
          title: place.place_name,
        });
      });
    } else {
      // 태그 없이 일반 검색 시 → 첫 장소만 마커
      const first = places[0];
      const lat = parseFloat(first.y);
      const lng = parseFloat(first.x);
      const position = new kakao.maps.LatLng(lat, lng);

      newMarkers = [
        new kakao.maps.Marker({
          position,
          map,
          title: first.place_name,
        }),
      ];
    }

    setPreviewMarkers(newMarkers);

    // 지도 중심 이동
    const centerLat = parseFloat(places[0].y);
    const centerLng = parseFloat(places[0].x);
    map.setCenter(new kakao.maps.LatLng(centerLat, centerLng));
  }, [places, map, selectedTag]);

  // 장소 수동 추가
  const handleAddPlace = (place) => {
    const id = place.id || `${place.x}-${place.y}`;
    if (selectedPlaces.find((p) => p.id === id)) return;

    const lat = parseFloat(place.y || place.lat);
    const lng = parseFloat(place.x || place.lng);
    const name = place.place_name || place.name;
    const address = place.road_address_name || place.address_name;

    const newPlace = { id, name, lat, lng, address, url: place.place_url };

    setSelectedPlaces((prev) => [...prev, newPlace]);

    if (map) {
      const markerPosition = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        map,
      });

      marker.placeId = id;
      setMarkers((prev) => [...prev, marker]);
      map.panTo(markerPosition);
    }
  };

  const handleRemovePlace = (placeId) => {
    setSelectedPlaces((prev) => prev.filter((p) => p.id !== placeId));

    const markerToRemove = markers.find((m) => m.placeId === placeId);
    if (markerToRemove) markerToRemove.setMap(null);

    setMarkers((prev) => prev.filter((m) => m.placeId !== placeId));
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 100px)" }}>
      {/* 왼쪽: 장소 선택 */}
      <div
        style={{
          width: "40%",
          padding: "24px",
          overflowY: "auto",
          borderRight: "1px solid #eee",
        }}
      >
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

        <div style={{ marginTop: "16px" }}>
          <h4>장소 검색 결과</h4>
          {places.map((place) => {
            const id = place.id || `${place.x}-${place.y}`;
            const name = place.place_name;
            const lat = parseFloat(place.y);
            const lng = parseFloat(place.x);
            const address = place.road_address_name || place.address_name;

            return (
              <PlaceCard
                key={id}
                place={{ id, name, lat, lng, address, url: place.place_url }}
                onAdd={handleAddPlace}
              />
            );
          })}
        </div>

        <div style={{ marginTop: "24px" }}>
          <SelectedPlaces
            selectedPlaces={selectedPlaces}
            onRemove={handleRemovePlace}
          />
        </div>
      </div>

      {/* 오른쪽: 지도 */}
      <div style={{ width: "60%" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

export default StepLocation;
