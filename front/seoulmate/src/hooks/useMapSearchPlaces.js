// src/hooks/useSearchPlaces.js
import { useEffect, useState, useRef } from "react";
import axios from "axios";

function useMapSearchPlaces(query, page = 1, size = 15) {
  const [places, setPlaces] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // query가 바뀌면 누적 초기화
  const prevQueryRef = useRef("");
  useEffect(() => {
    if (prevQueryRef.current !== query) {
      setPlaces([]);
      setHasMore(false);
      prevQueryRef.current = query;
    }
  }, [query]);

  useEffect(() => {
    if (!query) { setPlaces([]); setHasMore(false); return; }

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get("https://seoul-mate.co.kr/cityapi/search/kakao", {
          params: { query, size, page },
        });

        const docs = res?.data?.documents ?? [];
        const meta = res?.data?.meta ?? {};
        const isEnd = !!meta.is_end;

        setPlaces(prev => {
          // page=1이면 새 검색 → 초기화
          const base = page === 1 ? [] : prev;
          // id가 없으면 x-y로 키 생성해서 중복 제거
          const map = new Map(base.map(p => [String(p.id ?? `${p.x}-${p.y}`), p]));
          for (const d of docs) {
            const key = String(d.id ?? `${d.x}-${d.y}`);
            map.set(key, d);
          }
          return Array.from(map.values());
        });
        setHasMore(!isEnd);
      } catch (err) {
        console.error("장소 검색 실패:", err);
        if (page === 1) { setPlaces([]); setHasMore(false); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [query, page, size]);

  return { places, hasMore, loading };
}

export default useMapSearchPlaces;
