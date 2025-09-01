import { useEffect, useState } from "react";
import axios from "axios";

/**
 * 카카오 장소 검색 훅
 * - 항상 '서울시 '를 프리픽스로 붙여 검색 (이미 서울 계열로 시작하면 중복 방지)
 * - query가 문자열이 아닐 수 있으므로 안전하게 정규화
 */
function useSearchPlaces(query) {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    // ✅ query를 안전하게 문자열로 정규화
    const base = typeof query === "string" ? query.trim() : "";
    if (!base) {
      setPlaces([]);
      return;
    }

    const startsWithSeoul = /^(서울|서울시|서울특별시)\s*/i.test(base);
    const finalQuery = startsWithSeoul ? base : `서울시 ${base}`;

    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(
          "https://seoul-mate.co.kr/cityapi/search/kakao",
          { params: { query: finalQuery } }
        );
        if (!cancelled) setPlaces(res.data?.documents || []);
      } catch (err) {
        console.error("장소 검색 실패:", err);
        if (!cancelled) setPlaces([]);
      }
    })();

    return () => { cancelled = true; };
  }, [query]);

  return places;
}

export default useSearchPlaces;
