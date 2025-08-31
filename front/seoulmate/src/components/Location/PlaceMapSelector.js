// src/components/Location/PlaceMapSelector.jsx
import React, { useState, useEffect, useRef } from "react";
import useMapSearchPlaces from "../../hooks/useMapSearchPlaces";
import useKakaoKeywordSearch from "../../hooks/useKakaoKeywordSearch";
import PlaceCard from "./PlaceCard";
import SearchMapFilter from "./SearchMapFilter";
import styles from "./PlaceMapSelector.module.css";
import api from "../../api/api";
import requireLogin from "../../utils/requireLogin";
import simplifyCategory from "../../utils/simplifyCategory"; // ✅ 공통 유틸 사용

function PlaceMapSelector({ data, setData, regionKeyword, regionId, onPreviewPins }) {
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);

  const [wishIds, setWishIds] = useState(new Set());
  const lastCheckSeqRef = useRef(0);

  const isTaggedSearch = !!selectedTag;
  const keywordQuery = [keyword?.trim() || null, isTaggedSearch ? selectedTag : null, regionKeyword?.trim() || null]
    .filter(Boolean)
    .join(" ");
  const keywordActive = !!keyword?.trim();
  const rectActive = !keywordActive && !!selectedTag;
  const rectQuery = rectActive ? [selectedTag, regionKeyword?.trim()].filter(Boolean).join(" ") : "";

  const { places: placesByKeyword, loading: loadingKeyword, error: errorKeyword } =
    useKakaoKeywordSearch(keywordQuery, { size: 15, page: 1 });
  const { places: placesByRects, loading: loadingRects, error: errorRects } =
    useMapSearchPlaces(rectQuery, regionId);

  const places = keywordActive ? placesByKeyword : placesByRects;
  const loading = keywordActive ? loadingKeyword : loadingRects;
  const error = keywordActive ? errorKeyword : errorRects;

  // 배치 체크
  useEffect(() => {
    if (!places?.length) {
      setWishIds(new Set());
      return;
    }
    const ids = Array.from(new Set(places.map((p) => (p?.id != null ? String(p.id) : null)).filter(Boolean)));
    if (ids.length === 0) {
      setWishIds(new Set());
      return;
    }
    const seq = ++lastCheckSeqRef.current;
    api
      .post("/carts/check", ids)
      .then((res) => {
        if (seq !== lastCheckSeqRef.current) return;
        const map = res?.data || {};
        const inCartIds = Object.entries(map)
          .filter(([, v]) => v === true)
          .map(([k]) => String(k));
        setWishIds(new Set(inCartIds));
      })
      .catch((err) => {
        if (err?.response?.status !== 401) console.error("배치 체크 실패:", err);
        setWishIds(new Set());
      });
  }, [places]);

  // 찜 토글
  const toggleWishlist = async (place, next) => {
    // ⛔ 로그인 필수: 실패 시 요청 차단 + 알림
    if (!requireLogin()) return;

    const id = String(place.id);

    // UI 낙관 업데이트
    setWishIds((prev) => {
      const s = new Set(prev);
      next ? s.add(id) : s.delete(id);
      return s;
    });

    try {
      if (next) {
        // ✅ 카테고리 간단화해서 함께 저장 (공통 유틸 활용)
        const raw =
          place.category_group_name ||
          place.category_name ||
          place.category ||
          "";
        const category = simplifyCategory(raw);

        await api.post("/carts", {
          placeId: id,
          name: place.place_name,
          lat: String(place.y),
          lng: String(place.x),
          address: place.road_address_name || place.address_name || "",
          url: place.place_url,
          category,
        });
      } else {
        await api.delete(`/carts/place/${id}`);
      }
    } catch (e) {
      console.error("찜 토글 서버 반영 실패:", e);
      // 롤백
      setWishIds((prev) => {
        const s = new Set(prev);
        next ? s.delete(id) : s.add(id);
        return s;
      });
    }
  };

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

            {loading && <div className={styles.note}>불러오는 중…</div>}
            {error && <div className={styles.note} style={{ color: "crimson" }}>검색 실패</div>}
            {!loading && !error && places.length === 0 && (keywordActive || rectActive) && (
              <div className={styles.note}>
                {keywordActive ? "키워드로 검색 결과가 없습니다." : "이 지역/태그에서 검색 결과가 없습니다."}
              </div>
            )}

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
                  mode="browse"
                  isWishlisted={wishIds.has(String(place.id))}
                  onToggleWishlist={(p, next) => toggleWishlist(place, next)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceMapSelector;
