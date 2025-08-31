// src/components/Location/PlaceMapSelector.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios"; // 찜 상태 확인/토글용
import useMapSearchPlaces from "../../hooks/useMapSearchPlaces"; // rect 기반 검색 (POST /places/rects)
import useKakaoKeywordSearch from "../../hooks/useKakaoKeywordSearch"; // 키워드 검색 (GET /cityapi/search/kakao)
import PlaceCard from "./PlaceCard";
import SearchMapFilter from "./SearchMapFilter";
import styles from "./PlaceMapSelector.module.css";

function PlaceMapSelector({
  data,
  setData,
  regionKeyword,
  regionId,
  onPreviewPins,
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState(null); // 초기 미선택

  // ✅ 찜 상태 (이 화면 전용)
  const [wishIds, setWishIds] = useState(new Set());
  const lastCheckSeqRef = useRef(0); // 최신 응답만 반영하려고 버전 관리

  // 태그 선택 여부
  const isTaggedSearch = !!selectedTag;

  // ✅ 키워드 검색용 쿼리 (키워드 있을 때만 사용)
  const keywordQuery = [
    keyword?.trim() || null,
    isTaggedSearch ? selectedTag : null,
    regionKeyword?.trim() || null,
  ]
    .filter(Boolean)
    .join(" ");

  // 스위치: 키워드가 있으면 cityapi(GET) 활성
  const keywordActive = !!keyword?.trim();

  // ✅ rect 검색 활성 조건: 키워드가 없고 태그가 선택된 경우에만
  const rectActive = !keywordActive && !!selectedTag;

  // ✅ rect 검색용 쿼리 (초기 진입 시 자동 요청 방지를 위해 rectActive가 아닐 땐 빈 문자열)
  const rectQuery = rectActive
    ? [selectedTag, regionKeyword?.trim()].filter(Boolean).join(" ")
    : "";

  // 훅들
  const {
    places: placesByKeyword,
    loading: loadingKeyword,
    error: errorKeyword,
  } = useKakaoKeywordSearch(keywordQuery, { size: 15, page: 1 });

  const {
    places: placesByRects,
    loading: loadingRects,
    error: errorRects,
  } = useMapSearchPlaces(rectQuery, regionId);

  // 활성 소스 선택
  const places = keywordActive ? placesByKeyword : placesByRects;
  const loading = keywordActive ? loadingKeyword : loadingRects;
  const error = keywordActive ? errorKeyword : errorRects;

  // ✅ 배치 체크 (places 바뀔 때 마다 1회 호출)
  useEffect(() => {
    if (!places?.length) {
      setWishIds(new Set());
      return;
    }

    // 카카오 place id만 (없으면 제외)
    const ids = Array.from(
      new Set(
        places.map((p) => (p?.id != null ? String(p.id) : null)).filter(Boolean)
      )
    );
    if (ids.length === 0) {
      setWishIds(new Set());
      return;
    }

    // 최신 응답만 반영하기 위한 시퀀스 키
    const seq = ++lastCheckSeqRef.current;

    // Authorization 헤더(로그인 토큰) 부착
    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .post("https://seoul-mate.co.kr/contentapi/carts/check", ids, { headers })
      .then((res) => {
        if (seq !== lastCheckSeqRef.current) return; // 오래된 응답 무시
        const map = res?.data || {};
        const inCartIds = Object.entries(map)
          .filter(([, v]) => v === true)
          .map(([k]) => String(k));
        setWishIds(new Set(inCartIds));
      })
      .catch((err) => {
        console.error("배치 체크 실패:", err);
      });
  }, [places]);

  // ✅ 찜 토글: 낙관적 업데이트 + 서버 반영 (POST/DELETE)
  const toggleWishlist = async (place, next) => {
    const id = String(place.id);

    // 1) UI 낙관적 반영
    setWishIds((prev) => {
      const s = new Set(prev);
      next ? s.add(id) : s.delete(id);
      return s;
    });

    // 2) 서버 반영
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (next) {
        // 추가
        await axios.post(
          "https://seoul-mate.co.kr/contentapi/carts",
          {
            placeId: id, // DB Cart.placeId (문자열)
            name: place.place_name,
            lat: String(place.y),
            lng: String(place.x),
            address: place.road_address_name || place.address_name || "",
            url: place.place_url,
          },
          { headers }
        );
      } else {
        // 삭제 (placeId 기준)
        await axios.delete(
          `https://seoul-mate.co.kr/contentapi/carts/place/${id}`,
          {
            headers,
          }
        );
      }
    } catch (e) {
      console.error("찜 토글 서버 반영 실패:", e);
      // 3) 실패 시 롤백
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
            {error && (
              <div className={styles.note} style={{ color: "crimson" }}>
                검색 실패
              </div>
            )}
            {!loading &&
              !error &&
              places.length === 0 &&
              (keywordActive || rectActive) && (
                <div className={styles.note}>
                  {keywordActive
                    ? "키워드로 검색 결과가 없습니다."
                    : "이 지역/태그에서 검색 결과가 없습니다."}
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
                  isWishlisted={wishIds.has(String(place.id))} // 실제 카카오 id 기준
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
