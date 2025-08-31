import { useEffect, useState } from "react";
import axios from "axios";

export default function useKakaoKeywordSearch(query, { size = 15, page = 1 } = {}) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query?.trim();
    if (!q) { setPlaces([]); setError(null); return; }

    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get("https://seoul-mate.co.kr/cityapi/search/kakao", {
          params: { query: q, size, page },
          signal: ctrl.signal,
        });
        const docs = res?.data?.documents ?? [];
        setPlaces(docs);
      } catch (err) {
        if (err.name === "CanceledError") return;
        setError(err);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [query, size, page]);

  return { places, loading, error };
}
