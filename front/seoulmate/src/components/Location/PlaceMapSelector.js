// src/components/Location/PlaceMapSelector.jsx
import React, { useState, useEffect, useRef } from "react";
import useMapSearchPlaces from "../../hooks/useMapSearchPlaces";
import useKakaoKeywordSearch from "../../hooks/useKakaoKeywordSearch";
import PlaceCard from "./PlaceCard";
import SearchMapFilter from "./SearchMapFilter";
import styles from "./PlaceMapSelector.module.css";
import api from "../../api/api";
import requireLogin from "../../utils/requireLogin";
import simplifyCategory from "../../utils/simplifyCategory";

function PlaceMapSelector({
  data, setData,
  regionKeyword, regionId,
  onPlotCategoryPins,   // ★ 카테고리 버튼 핀 찍기
  onFocusPlace,         // ★ 키워드 제목 클릭 시 프리뷰 핀 + 팝업
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);

  // ── 키워드 검색(장소명) ─────────────────────────────────────
  const kwQuery = [keyword?.trim() || null, regionKeyword?.trim() || null]
    .filter(Boolean).join(" ");
  const keywordActive = !!keyword?.trim();

  const {
    places: kwPlaces,
    loading: loadingKw,
    error: errorKw,
    hasMore: hasMoreKw,
    loadMore: loadMoreKw,
  } = useKakaoKeywordSearch(kwQuery, { size: 15, maxPages: 3 });

  // ── 카테고리 검색(버튼) ────────────────────────────────────
  const tagQuery = selectedTag
    ? [selectedTag, regionKeyword?.trim()].filter(Boolean).join(" ")
    : "";
  const { places: tagPlaces } = useMapSearchPlaces(tagQuery, regionId);

  // 카테고리 결과는 리스트를 그리지 않고 지도에만 핀찍기
  useEffect(() => {
    if (!onPlotCategoryPins) return;
    if (!selectedTag) { onPlotCategoryPins([]); return; }
    const mapped = (tagPlaces || [])
      .map(p => ({
        id: String(p.id ?? `${p.x}-${p.y}`),
        name: p.place_name ?? p.name ?? "",
        lat: parseFloat(p.y ?? p.lat),
        lng: parseFloat(p.x ?? p.lng),
        address: p.road_address_name || p.address_name || p.address || "",
        url: p.place_url || p.url || "",
      }))
      .filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    onPlotCategoryPins(mapped);
  }, [selectedTag, tagPlaces, onPlotCategoryPins]);

  // ── 찜(키워드 리스트에만 적용) ─────────────────────────────
  const [wishIds, setWishIds] = useState(new Set());
  const lastCheckSeqRef = useRef(0);

  useEffect(() => {
    const places = kwPlaces || [];
    if (!places.length) { setWishIds(new Set()); return; }

    const ids = Array.from(new Set(
      places.map((p) => (p?.id != null ? String(p.id) : null)).filter(Boolean)
    ));
    if (ids.length === 0) { setWishIds(new Set()); return; }

    const seq = ++lastCheckSeqRef.current;
    api.post("/carts/check", ids)
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
  }, [kwPlaces]);

  const toggleWishlist = async (place, next) => {
    if (!requireLogin()) return;
    const id = String(place.id);
    setWishIds((prev) => {
      const s = new Set(prev);
      next ? s.add(id) : s.delete(id);
      return s;
    });
    try {
      if (next) {
        const category = simplifyCategory(
          place.category || place.category_name || place.category_group_name || ""
        );
        await api.post("/carts", {
          placeId: id,
          name: place.name,
          lat: String(place.lat),
          lng: String(place.lng),
          address: place.address || "",
          url: place.url || "",
          category,
        });
      } else {
        await api.delete(`/carts/place/${id}`);
      }
    } catch (e) {
      console.error("찜 토글 서버 반영 실패:", e);
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

          {/* 상단 카테고리 버튼 + 아래 키워드 입력 */}
          
          <SearchMapFilter
            keyword={keyword}
            onKeywordChange={setKeyword}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            regionId={regionId}
          />

          {/* ▼ 키워드(장소명) 검색 결과만 리스트로 렌더 */}
          <div className={styles.resultList}>
            <h4>장소 검색 결과</h4>
            {loadingKw && <div className={styles.note}>불러오는 중…</div>}
            {errorKw && <div className={styles.note} style={{ color: "crimson" }}>검색 실패</div>}
            {!loadingKw && !errorKw && keywordActive && (kwPlaces?.length ?? 0) === 0 && (
              <div className={styles.note}>키워드로 검색 결과가 없습니다.</div>
            )}

            {(kwPlaces || []).map((p) => {
              const id = String(p.id ?? `${p.x}-${p.y}`);
              const normalized = {
                id,
                name: p.place_name ?? p.name,
                lat: parseFloat(p.y ?? p.lat),
                lng: parseFloat(p.x ?? p.lng),
                address: p.road_address_name || p.address_name || p.address || "",
                url: p.place_url || p.url || "",
                category: p.category_group_name || p.category_name || p.category || "",
                x: p.x, y: p.y, place_name: p.place_name, place_url: p.place_url,
              };

              return (
                <PlaceCard
                  key={id}
                  place={normalized}
                  mode="browse"
                  isWishlisted={wishIds.has(id)}
                  onToggleWishlist={(np, next) => toggleWishlist(normalized, next)}
                  onTitleClick={() => onFocusPlace?.(normalized)}  // 제목 클릭 시 프리뷰 핀 + 팝업
                />
              );
            })}

            {keywordActive && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={loadMoreKw}
                  disabled={loadingKw || !hasMoreKw}
                  className={styles.loadMoreBtn}
                >
                  {loadingKw ? "불러오는 중…" : hasMoreKw ? "장소 더보기" : "더 불러올 결과 없음"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceMapSelector;