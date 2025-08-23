// src/components/Location/PlaceSelector.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import useSearchPlaces from "../../hooks/useSearchPlaces";
import SelectedPlacesPanel from "./SelectedPlacesPanel";
import PlaceCard from "./PlaceCard";
import SearchFilter from "./SearchFilter";
import styles from "./PlaceSelector.module.css";
/* global kakao */

export default function PlaceSelector({
  data, // { places: [...] , ... }
  setData, // setData(updater)
  defaultKeyword = "", // ✅ prefill: 기본 검색어
  defaultPlace = null, // ✅ prefill: { id,name,lat,lng,address,category,stay }
  className = "", // ✅ 넓은 지도용 .map-panel 같은 외부 클래스
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [previewMarkers, setPreviewMarkers] = useState([]);
  const [keyword, setKeyword] = useState(defaultKeyword || "");
  const [selectedTag, setSelectedTag] = useState("전체");
  const [prefillApplied, setPrefillApplied] = useState(false); // ✅ 중복 적용 방지

  const centerX = 126.978;
  const centerY = 37.5665;

  // 부모에서 관리하는 선택된 장소
  const selectedPlaces = data.places || [];

  const isTaggedSearch = selectedTag && selectedTag !== "전체";
  const searchQuery =
    keyword.trim() + (isTaggedSearch ? ` ${selectedTag}` : "");
  const places = useSearchPlaces(searchQuery);

  // 1) 지도 초기화 + 컨테이너 크기 변화 대응(relayout)
  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current) return;

    const mapInstance = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerY, centerX),
      level: 5,
    });
    setMap(mapInstance);

    // 크기 변화 대응
    const ro = new ResizeObserver(() => {
      mapInstance.relayout();
    });
    ro.observe(mapRef.current);

    const onResize = () => mapInstance.relayout();
    window.addEventListener("resize", onResize);

    // 언마운트 시 정리
    return () => {
      markers.forEach((m) => m.setMap && m.setMap(null));
      previewMarkers.forEach((m) => m.setMap && m.setMap(null));
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) prefill: 초기에 장소 자동 추가 + 지도 포커싱 (1회성)
  useEffect(() => {
    if (!map || !defaultPlace || prefillApplied) return;

    const lat = Number(defaultPlace.lat);
    const lng = Number(defaultPlace.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const pos = new kakao.maps.LatLng(lat, lng);
      map.setLevel(5);
      map.setCenter(pos);
      const mk = new kakao.maps.Marker({ position: pos, map });
      mk.placeId = String(defaultPlace.id || `prefill-${Date.now()}`);
      setMarkers((prev) => [...prev, mk]);
    }

    // 선택목록 중복 체크 후 추가
    setData((prev) => {
      const prevPlaces = Array.isArray(prev.places) ? prev.places : [];
      const id = String(
        defaultPlace.id || `${defaultPlace.lng}-${defaultPlace.lat}`
      );

      const exists = prevPlaces.some(
        (p) =>
          (p.placeId ?? p.id) === id ||
          (Number(p.lat) === Number(defaultPlace.lat) &&
            Number(p.lng) === Number(defaultPlace.lng))
      );
      if (exists) return prev;

      const newPlace = {
        placeId: id, // ✅ 고유 키
        id, // (호환성 위해 같이 넣어둠)
        name: defaultPlace.name || "장소",
        lat: defaultPlace.lat,
        lng: defaultPlace.lng,
        address: defaultPlace.address || "",
        url: defaultPlace.url || "",
        category: defaultPlace.category || defaultKeyword || "",
        stay: defaultPlace.stay || 60,
      };

      return { ...prev, places: [...prevPlaces, newPlace] };
    });

    setPrefillApplied(true);
  }, [map, defaultPlace, defaultKeyword, prefillApplied, setData]);

  // 3) 검색 결과에 따라 preview 마커 갱신
  useEffect(() => {
    if (!map) return;

    // 이전 미리보기 마커 삭제
    previewMarkers.forEach((m) => m.setMap(null));

    if (!places || places.length === 0) {
      setPreviewMarkers([]);
      return;
    }

    // 태그 검색이면 결과 전체, 아니면 첫 결과만
    const list = isTaggedSearch ? places : [places[0]];
    const nextPreview = list.map((place) => {
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

  // 4) 장소 추가
  const handleAddPlace = (place) => {
    const id = String(place.id || `${place.x}-${place.y}`);
    if (selectedPlaces.some((p) => (p.placeId ?? p.id) === id)) return;

    const newPlace = {
      placeId: id, // ✅ 고유 키 보장
      id,
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

  // 5) 개별 제거 (id/ placeId 모두 허용)
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

  // 6) 전체 제거
  const handleRemoveAll = () => {
    setData((prev) => ({ ...prev, places: [] }));
    markers.forEach((m) => m.setMap(null));
    setMarkers([]);
  };

  // 7) 정렬 변경(dnd) 반영
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

      {/* 오른쪽: 지도 (외부에서 전달한 className 추가 적용) */}
      <div className={`${styles.mapPanel} ${className || ""}`}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
