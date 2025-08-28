// src/components/Location/PlaceSelector.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
import useSearchPlaces from "../../hooks/useSearchPlaces";
import SelectedPlacesPanel from "./SelectedPlacesPanel";
import PlaceCard from "./PlaceCard";
import SearchFilter from "./SearchFilter";
import styles from "./PlaceSelector.module.css";
import api from "../../api/api";
/* global kakao */

export default function PlaceSelector({
  data,
  setData,
  defaultKeyword = "",
  defaultPlace = null,
  className = "",
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [previewMarkers, setPreviewMarkers] = useState([]);

  const [keyword, setKeyword] = useState(defaultKeyword || "");
  const [selectedTag, setSelectedTag] = useState("전체");
  const [prefillApplied, setPrefillApplied] = useState(false);

  // 🔸 장바구니 결과 보관 (카카오검색 결과와 동일한 shape로 매핑)
  const [cartPlaces, setCartPlaces] = useState([]);

  const centerX = 126.978;
  const centerY = 37.5665;

  // 폼의 단일 소스: selectedPlaces
  const selectedPlaces = data.selectedPlaces || [];

  const isTaggedSearch = selectedTag && selectedTag !== "전체";

  // 기본 카카오 검색 훅(장바구니가 아닐 때 사용)
  const searchQuery =
    selectedTag === "장바구니"
      ? "" // 훅은 그냥 호출하지만 결과는 아래에서 사용하지 않음
      : keyword.trim() + (isTaggedSearch ? ` ${selectedTag}` : "");
  const kakaoPlaces = useSearchPlaces(searchQuery);

  // ✅ 최종적으로 화면/지도에 보여줄 결과
  const displayPlaces = useMemo(
    () => (selectedTag === "장바구니" ? cartPlaces : kakaoPlaces),
    [selectedTag, cartPlaces, kakaoPlaces]
  );

  // 지도 초기화
  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current) return;

    const mapInstance = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerY, centerX),
      level: 5,
    });
    setMap(mapInstance);

    const ro = new ResizeObserver(() => mapInstance.relayout());
    ro.observe(mapRef.current);

    const onResize = () => mapInstance.relayout();
    window.addEventListener("resize", onResize);

    return () => {
      markers.forEach((m) => m.setMap && m.setMap(null));
      previewMarkers.forEach((m) => m.setMap && m.setMap(null));
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔸 prefill 1회 적용 (선택목록에 넣기)
  useEffect(() => {
    if (
      !map ||
      !defaultPlace ||
      !defaultPlace.lat ||
      !defaultPlace.lng ||
      prefillApplied
    )
      return;

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
      const prevSel = Array.isArray(prev.selectedPlaces)
        ? prev.selectedPlaces
        : [];
      const id = String(
        defaultPlace.id || `${defaultPlace.lng}-${defaultPlace.lat}`
      );

      const exists = prevSel.some(
        (p) =>
          (p.placeId ?? p.id) === id ||
          (Number(p.lat) === Number(defaultPlace.lat) &&
            Number(p.lng) === Number(defaultPlace.lng))
      );
      if (exists) return prev;

      const newPlace = {
        placeId: id,
        id,
        name: defaultPlace.name || "장소",
        lat: Number(defaultPlace.lat),
        lng: Number(defaultPlace.lng),
        address: defaultPlace.address || "",
        url: defaultPlace.url || "",
        category: defaultPlace.category || defaultKeyword || "",
        stay: defaultPlace.stay || 60,
      };

      return { ...prev, selectedPlaces: [...prevSel, newPlace] };
    });

    setPrefillApplied(true);
  }, [map, defaultPlace, defaultKeyword, prefillApplied, setData]);

  // 🔸 “장바구니” 태그 선택 시 내 찜 목록 불러오기
  useEffect(() => {
    if (selectedTag !== "장바구니") {
      setCartPlaces([]);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      setCartPlaces([]);
      return;
    }

    api
      .get("/carts/mine", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        // 카카오 검색 결과와 동일한 shape로 매핑
        const mapped = list.map((p, i) => ({
          id: String(p.placeId ?? p.id ?? i),
          x: String(p.lng), // kakao: x = lng
          y: String(p.lat), // kakao: y = lat
          place_name: p.name,
          road_address_name: p.address,
          address_name: p.address,
          place_url: p.url,
        }));
        setCartPlaces(mapped);
      })
      .catch((err) => {
        console.error("[GET /carts/mine] failed:", err);
        if (err?.response?.status === 401) alert("로그인이 필요합니다.");
        setCartPlaces([]);
      });
  }, [selectedTag]);

  // 검색 결과/장바구니 결과 → 미리보기 마커
  useEffect(() => {
    if (!map) return;

    // 기존 프리뷰 마커 제거
    previewMarkers.forEach((m) => m.setMap(null));

    if (!displayPlaces || displayPlaces.length === 0) {
      setPreviewMarkers([]);
      return;
    }

    // 태그 검색이면 전부, 아니면 첫 번째만
    const list =
      selectedTag === "장바구니"
        ? displayPlaces
        : isTaggedSearch
        ? displayPlaces
        : [displayPlaces[0]];

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

    const first = displayPlaces[0];
    map.setCenter(
      new kakao.maps.LatLng(parseFloat(first.y), parseFloat(first.x))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayPlaces, map, isTaggedSearch, selectedTag]);

  // 장소 추가 (PlaceCard에서 넘겨주는 place는 통일된 형태)
  const handleAddPlace = (place) => {
    const id = String(place.id || `${place.x}-${place.y}`);
    if (selectedPlaces.some((p) => (p.placeId ?? p.id) === id)) return;

    const newPlace = {
      placeId: id,
      name: place.name,
      lat: Number(place.lat ?? place.y),
      lng: Number(place.lng ?? place.x),
      address: place.address,
      url: place.url,
    };

    setData((prev) => ({
      ...prev,
      selectedPlaces: [...(prev.selectedPlaces || []), newPlace],
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

  // 개별 제거
  const handleRemovePlace = (idOrPlaceId) => {
    setData((prev) => ({
      ...prev,
      selectedPlaces: (prev.selectedPlaces || []).filter(
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

  // 전체 제거
  const handleRemoveAll = () => {
    setData((prev) => ({ ...prev, selectedPlaces: [] }));
    markers.forEach((m) => m.setMap(null));
    setMarkers([]);
  };

  // 정렬 변경(dnd)
  const handleReorder = (newList) => {
    setData((prev) => ({ ...prev, selectedPlaces: newList }));
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
            {displayPlaces.map((place) => {
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
                  mode="select" // 명시해도 되고(기본값이 select)
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
      <div className={`${styles.mapPanel} ${className || ""}`}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
