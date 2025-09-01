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

// 선택된 장소를 마커와 매칭하기 위한 키
const placeKey = (p) =>
  String(p?.uid ?? p?.placeId ?? p?.id ?? `${p?.lng ?? p?.x}-${p?.lat ?? p?.y}`);

export default function PlaceSelector({
  data,
  setData,
  defaultKeyword = "",
  defaultPlace = null,
  className = "",
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  // ✅ 사용자가 "추가"한 장소 마커만 관리
  const [markers, setMarkers] = useState([]);

  // ❌ 자동 프리뷰 마커는 더 이상 생성하지 않음(클리어 용도만)
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

  // 기본 카카오 검색 훅(요청은 그대로, 지도엔 자동 마커 X)
  const searchQuery =
    selectedTag === "장바구니"
      ? ""
      : (keyword || "").toString().trim() + (isTaggedSearch ? ` ${selectedTag}` : "");
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

  /**
   * ✅ prefill(기본 장소) 적용 시:
   *  - 마커는 찍지 않고 중심만 이동(“초기 자동 핀 제거” 요구사항)
   */
  useEffect(() => {
    if (!map || !defaultPlace || prefillApplied) return;

    const lat = Number(defaultPlace.lat);
    const lng = Number(defaultPlace.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const pos = new kakao.maps.LatLng(lat, lng);
      map.setLevel(5);
      map.setCenter(pos); // 중심만 이동
    }

    setPrefillApplied(true);
  }, [map, defaultPlace, prefillApplied]);

  // “장바구니” 선택 시 내 찜 목록 불러오기(지도 자동 마커 X)
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
        cartId: String(p.id ?? `row-${i}`),
        id: String(p.placeId ?? p.kakaoId ?? p.id ?? i),
        x: String(p.lng),
        y: String(p.lat),
        place_name: p.name,
        road_address_name: p.address,
        address_name: p.address,
        place_url: p.url,
        category: p.category ?? "",
      }));
      setCartPlaces(mapped);
    });
  }, [selectedTag]);

  /**
   * ❌ 검색/카테고리 결과 자동 프리뷰 마커 제거
   *  - 자동 마커는 만들지 않고, 결과가 있으면 중심만 이동
   */
  useEffect(() => {
    if (!map) return;

    // 기존 프리뷰 마커 제거
    previewMarkers.forEach((m) => m.setMap(null));
    setPreviewMarkers([]);

    if (displayPlaces && displayPlaces.length > 0) {
      const first = displayPlaces[0];
      const y = parseFloat(first.y);
      const x = parseFloat(first.x);
      if (Number.isFinite(y) && Number.isFinite(x)) {
        map.setCenter(new kakao.maps.LatLng(y, x));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayPlaces, map, isTaggedSearch, selectedTag, keyword]);

  /**
   * ✅ 선택된 장소(selectedPlaces) ↔ 지도 마커 동기화
   *  - (1) 처음 폼 로딩 시 이미 선택된 장소들 → 마커 생성
   *  - (2) 선택 목록에서 제거하면 해당 마커 제거
   *  - (3) 외부에서 목록이 바뀌어도 항상 동기화
   */
  useEffect(() => {
    if (!map) return;

    const existing = new Map(
      markers.map((m) => [String(m.uid ?? m.placeId ?? m.id), m])
    );
    const desiredKeys = new Set(selectedPlaces.map(placeKey));

    // 1) 없는 마커 생성
    const newMarkers = [...markers];
    selectedPlaces.forEach((p, i) => {
      const key = placeKey(p);
      if (existing.has(key)) return;

      const lat = Number(p.lat ?? p.y);
      const lng = Number(p.lng ?? p.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const mk = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        map,
      });
      mk.uid = key;
      mk.placeId = String(p.placeId ?? p.id ?? `p-${i}`);
      newMarkers.push(mk);
    });

    // 2) 불필요한 마커 제거
    const filtered = newMarkers.filter((m) => {
      const key = String(m.uid ?? m.placeId ?? m.id);
      if (desiredKeys.has(key)) return true;
      try { m.setMap(null); } catch {}
      return false;
    });

    // 필요할 때만 상태 업데이트(불필요한 리렌더 방지)
    if (filtered.length !== markers.length ||
        filtered.some((m, i) => markers[i] !== m)) {
      setMarkers(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedPlaces]);

  // ✅ 사용자가 "추가"한 경우에만 마커 생성
  const handleAddPlace = (place) => {
    const id = String(place.id || `${place.x}-${place.y}`);

    const nameRaw = place.name ?? place.place_name ?? "";
    const name = String(nameRaw).trim();
    if (!name) return;

    const norm = (s) => String(s ?? "").trim().toLowerCase();
    const exists = selectedPlaces.some((p) => norm(p.name ?? p.place_name) === norm(name));
    if (exists) return;

    const categoryRaw =
      place.category ??
      place.category_group_name ??
      place.category_name ??
      "";
    const category = simplifyCategory(categoryRaw);

    const uid = genUid();
    const newPlace = {
      uid,
      placeId: id,
      name,
      lat: Number(place.lat ?? place.y),
      lng: Number(place.lng ?? place.x),
      address: place.address ?? place.road_address_name ?? place.address_name ?? "",
      url: place.url ?? place.place_url ?? "",
      category,
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
      marker.uid = placeKey(newPlace);
      marker.placeId = id;
      setMarkers((prev) => [...prev, marker]);
      map.panTo(marker.getPosition());
    }
  };

  // 개별 제거: uid 우선, 없으면 placeId로 폴백
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
                  key={rowKey}
                  place={{
                    id: kakaoId,
                    name: place.place_name,
                    lat: parseFloat(place.y),
                    lng: parseFloat(place.x),
                    address: place.road_address_name || place.address_name,
                    url: place.place_url,
                    category:
                      place.category_group_name ||
                      place.category_name ||
                      place.category || "",
                  }}
                  mode="select"
                  onAdd={handleAddPlace}   // "추가" 눌러야만 마커 생성
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
