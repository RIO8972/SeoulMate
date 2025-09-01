// hooks/useKakaoKeywordSearch.js
import { useEffect, useRef, useState } from "react";
import axios from "axios";

/**
 * Kakao 키워드 검색 무한 로드 훅
 * - query: 검색어
 * - options: { size=15, maxPages=3 }
 * 반환: { places, loading, error, hasMore, loadMore, page, reset }
 */
export default function useKakaoKeywordSearch(query, { size = 15, maxPages = 3 } = {}) {
  const [places, setPlaces] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cancelRef = useRef(null);

  const reset = () => {
    setPlaces([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  };

  // 검색어 바뀌면 초기화
  useEffect(() => {
    if (!query?.trim()) {
      reset();
      return;
    }
    // page를 1로 리셋 → 첫 페이지부터 새로 로드
    setPage(1);
  }, [query]);

  // 실제 로드
  useEffect(() => {
    if (!query?.trim()) return;

    setLoading(true);
    setError(null);

    // 이전 요청 취소
    if (cancelRef.current) cancelRef.current();

    const controller = new AbortController();
    cancelRef.current = () => controller.abort();

    axios.get("https://seoul-mate.co.kr/cityapi/search/kakao", {
      params: { query, page, size },
      signal: controller.signal,
    })
    .then((res) => {
      const docs = res?.data?.documents ?? [];
      const isEnd = !!res?.data?.meta?.is_end;

      setPlaces((prev) => (page === 1 ? docs : [...prev, ...docs]));
      setHasMore(!isEnd && page < maxPages);
    })
    .catch((err) => {
      if (axios.isCancel?.(err)) return;
      if (err?.name === "CanceledError") return;
      setError(err);
    })
    .finally(() => setLoading(false));

    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, [query, page, size, maxPages]);

  const loadMore = () => {
    setPage((p) => (hasMore ? p + 1 : p));
  };

  return { places, loading, error, hasMore, loadMore, page, reset };
}
