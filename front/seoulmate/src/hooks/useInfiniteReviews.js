// src/hooks/useInfiniteReviews.js
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

/**
 * 서버: GET /reviews?size=12&cursor=...
 * 응답: { items: [ {id,title,intro,region,thumbnail,createdAt,likeCount}... ],
 *         nextCursor: "2025-08-12T10:20:30.123_123",
 *         hasNext: true/false }
 */
export default function useInfiniteReviews({ pageSize = 12 } = {}) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("https://seoul-mate.co.kr/contentapi/reviews-list", {
        params: { size: pageSize, cursor },
        // withCredentials: true, // 쿠키를 같이 보낼 일이 있으면
        })
        console.log("[/reviews-list] res.data =", res.data);
      const { items: next = [], nextCursor = null, hasNext: hn = false } = res.data || {};
      setItems((prev) => [...prev, ...next]);
      setCursor(nextCursor);
      setHasNext(Boolean(hn));
    } catch (e) {
      console.error("[/reviews] loadMore error:", e);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasNext, loading, pageSize]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && loadMore()),
      { root: null, rootMargin: "200px 0px", threshold: 0 }
    );
    const el = sentinelRef.current;
    if (el) io.observe(el);
    return () => {
      if (el) io.unobserve(el);
      io.disconnect();
    };
  }, [loadMore]);

  /** 정렬/필터가 바뀔 때 초기화용 */
  const reload = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasNext(true);
  }, []);

  return { items, setItems, loading, hasNext, sentinelRef, reload };
}
