import React, { useEffect, useMemo, useRef, useState } from "react";
import useSearchPlaces from "../../hooks/useSearchPlaces";
import SelectedPlacesPanel from "./SelectedPlacesPanel";
import PlaceCard from "./PlaceCard";
import SearchFilter from "./SearchFilter";
import styles from "./PlaceSelector.module.css";
import api from "../../api/api";
/* global kakao */

// 카테고리 간단화(PlaceCard와 동일 규칙)
const simplifyCategory = (raw = "") => {
  const s = String(raw).trim();
  if (!s) return "";
  const t = s.replace(/\s/g, "");
  if (/관광|명소|여행|유적|전망대|랜드마크/.test(t)) return "관광명소";
  if (/카페|디저트/.test(t)) return "카페";
  if (/음식|식당|한식|중식|양식|일식|분식|치킨|피자|고기|회|국수|돈까스/.test(t)) return "음식점";
  if (/숙박|호텔|모텔|펜션|리조트|게스트/.test(t)) return "숙박";
  if (/쇼핑|시장|백화점|아울렛|마트|편의점/.test(t)) return "쇼핑";
  if (/문화|박물관|전시|미술관|공연|도서관|영화관|극장/.test(t)) return "문화시설";
  if (/공원|자연|산|호수|강|해변|섬|둘레길|산책로|정원/.test(t)) return "자연/공원";
  return s.split(">").shift()?.trim() ?? "기타";
};

const genUid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `uid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

  // 장바구니 결과(카카오 검색 shape로 맞춤)
  const [cartPlaces, setCartPlaces] = useState([]);

  const centerX = 126.978;
  const centerY = 37.5665;

  const selectedPlaces = data.selectedPlaces || [];
  const isTaggedSearch = selectedTag && selectedTag !== "전체";

  // 기본 카카오 검색 훅
  const searchQuery =
    selectedTag === "장바구니"
      ? ""
      : keyword.trim() + (isTaggedSearch ? ` ${selectedTag}` : "");
  const kakaoPlaces = useSearchPlaces(searchQuery);

  // 실제로 보여줄 목록
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

  // prefill 1회 적용(+카테고리 저장)
  useEffect(() => {
    if (!map || !defaultPlace || !defaultPlace.lat || !defaultPlace.lng || prefillApplied) return;

    const lat = Number(defaultPlace.lat);
    const lng = Number(defaultPlace.lng);
    const uid = genUid();

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const pos = new kakao.maps.LatLng(lat, lng);
      map.setLevel(5);
      map.setCenter(pos);
      const mk = new kakao.maps.Marker({ position: pos, map });
      mk.uid = uid;
      mk.placeId = String(defaultPlace.id || `prefill-${Date.now()}`);
      setMarkers((prev) => [...prev, mk]);
    }

    // 선택목록 중복 체크 후 추가
    setData((prev) => {
      const prevSel = Array.isArray(prev.selectedPlaces) ? prev.selectedPlaces : [];
      const id = String(defaultPlace.id || `${defaultPlace.lng}-${defaultPlace.lat}`);

      const exists = prevSel.some(
        (p) =>
          (p.placeId ?? p.id) === id ||
          (Number(p.lat) === Number(defaultPlace.lat) &&
            Number(p.lng) === Number(defaultPlace.lng))
      );
      if (exists) return prev;

      const newPlace = {
        uid,
        placeId: id,
        id,
        name: defaultPlace.name || "장소",
        lat,
        lng,
        address: defaultPlace.address || "",
        url: defaultPlace.url || "",
        category: simplifyCategory(defaultPlace.category || defaultKeyword || ""), // ✅ 저장
        stay: defaultPlace.stay || 60,
      };
      return { ...prev, selectedPlaces: [...prevSel, newPlace] };
    });

    setPrefillApplied(true);
  }, [map, defaultPlace, defaultKeyword, prefillApplied, setData]);

  // “장바구니” 선택 시 내 찜 목록 불러오기
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
    api.get("/carts/mine").then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped = list.map((p, i) => ({
        // 렌더링 key용: 행 고유 id
        cartId: String(p.id ?? `row-${i}`),

        //장소 식별: Kakao/POI id
        id: String(p.placeId ?? p.kakaoId ?? p.id ?? i),

        x: String(p.lng),
        y: String(p.lat),
        place_name: p.name,
        road_address_name: p.address,
        address_name: p.address,
        place_url: p.url,

        // 서버 category 그대로
        category: p.category ?? "",
      }));
      setCartPlaces(mapped);
    });
  }, [selectedTag]);

  // 검색/장바구니 결과 → 프리뷰 마커
  useEffect(() => {
    if (!map) return;

    previewMarkers.forEach((m) => m.setMap(null));

    if (!displayPlaces || displayPlaces.length === 0) {
      setPreviewMarkers([]);
      return;
    }

    const list =
      selectedTag === "장바구니"
        ? displayPlaces
        : isTaggedSearch
        ? displayPlaces
        : [displayPlaces[0]];

    const nextPreview = list.map((place) => {
      const mk = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)),
        map,
        title: place.place_name,
      });
      return mk;
    });
    setPreviewMarkers(nextPreview);

    const first = displayPlaces[0];
    map.setCenter(new kakao.maps.LatLng(parseFloat(first.y), parseFloat(first.x)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayPlaces, map, isTaggedSearch, selectedTag]);

  // 장소 추가: 이름 중복 방지 + uid 부여 + 카테고리 저장
  const handleAddPlace = (place) => {
    const id = String(place.id || `${place.x}-${place.y}`);

    const nameRaw = place.name ?? place.place_name ?? "";
    const name = String(nameRaw).trim();
    if (!name) return;

    const norm = (s) => String(s ?? "").trim().toLowerCase();
    const exists = selectedPlaces.some((p) => norm(p.name ?? p.place_name) === norm(name));
    if (exists) return;

    // 원본 카테고리 → 간단화
    const categoryRaw =
      place.category ??
      place.category_group_name ??
      place.category_name ??
      "";
    const category = simplifyCategory(categoryRaw);

    const uid = genUid();
    const newPlace = {
      uid,             // 고유키(삭제/정렬 시 사용)
      placeId: id,     // 보조키
      name,
      lat: Number(place.lat ?? place.y),
      lng: Number(place.lng ?? place.x),
      address: place.address ?? place.road_address_name ?? place.address_name ?? "",
      url: place.url ?? place.place_url ?? "",
      category,        // ✅ DB 저장용 카테고리
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
      marker.uid = uid;
      marker.placeId = id;
      setMarkers((prev) => [...prev, marker]);
      map.panTo(marker.getPosition());
    }
  };

  // 개별 제거: uid 우선, 없으면 placeId로 폴백하여 "하나만" 제거
  const handleRemovePlace = (key) => {
    const strKey = String(key);

    setData((prev) => {
      const arr = prev.selectedPlaces || [];
      const idx = arr.findIndex(
        (p) => String(p.uid) === strKey || String(p.placeId ?? p.id) === strKey
      );
      if (idx === -1) return prev;
      const next = arr.slice();
      next.splice(idx, 1);
      return { ...prev, selectedPlaces: next };
    });

    setMarkers((prev) => {
      const i = prev.findIndex(
        (m) => String(m.uid) === strKey || String(m.placeId ?? m.id) === strKey
      );
      if (i === -1) return prev;
      const next = prev.slice();
      try { next[i]?.setMap(null); } catch {}
      next.splice(i, 1);
      return next;
    });
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
          <p className="review-subtitle">데이트 코스에 포함된 장소를 선택해주세요</p>

          <SearchFilter
            keyword={keyword}
            onKeywordChange={setKeyword}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />

          <div className={styles.resultList}>
            <h4>장소 검색 결과</h4>
            {displayPlaces.map((place, idx) => {
              const kakaoId = String(place.id || `${place.x}-${place.y}`);
              const rowKey =
                selectedTag === "장바구니"
                  ? String(place.cartId ?? `${kakaoId}|${place.place_name}|${idx}`)
                  : kakaoId;

              return (
                <PlaceCard
                  key={rowKey}                // ✅ 행 기준 고유 key
                  place={{
                    id: kakaoId,              // ✅ 장소 id (비지니스 식별)
                    name: place.place_name,
                    lat: parseFloat(place.y),
                    lng: parseFloat(place.x),
                    address: place.road_address_name || place.address_name,
                    url: place.place_url,
                    category:
                      place.category_group_name ||
                      place.category_name ||
                      place.category || "",    // ✅ 장바구니 항목도 문제없이 표시
                  }}
                  mode="select"
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