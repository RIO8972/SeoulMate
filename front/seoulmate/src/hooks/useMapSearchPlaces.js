// src/hooks/useMapSearchPlaces.js
import { useEffect, useMemo, useRef, useState } from "react";
import rectPoints from "../data/rectPoints"; // "regionId": [ "l,b,r,t", ... ]
import axios from "axios";

function dedupeById(list = []) {
  const seen = new Set();
  const out = [];
  for (const it of list) {
    const id = it?.id ?? it?.place_id ?? JSON.stringify(it);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(it);
    }
  }
  return out;
}

export default function useMapSearchPlaces(query, regionId) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1) regionId → rectList
  const rectList = useMemo(() => {
    const arr = rectPoints?.[regionId];
    return Array.isArray(arr) ? arr : [];
  }, [regionId]);

  // 빈 배열 안정 참조(루프 방지)
  const EMPTY = useRef([]).current;

  // 2) 디버그 로그
  useEffect(() => {
    console.group(
      "%c[useMapSearchPlaces: DEBUG]",
      "color:#4f46e5;font-weight:700"
    );
    console.log("regionId:", regionId);
    console.log("query   :", query);
    console.log("rectList exists:", Array.isArray(rectList));
    console.log("rectList length:", rectList.length);
    if (rectList.length) {
      console.log("rectList (full):", rectList);
      console.table(rectList);
    }
    console.groupEnd();
  }, [regionId, query, rectList]);

  // 3) 서버 요청 (/places/rects)
  useEffect(() => {
    // guard
    if (!query?.trim()) {
      setPlaces(EMPTY);
      setError(null);
      return;
    }
    if (!rectList.length) {
      setPlaces(EMPTY);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        console.time("[POST /places/rects]");

        const res = await axios.post(
          "https://seoul-mate.co.kr/cityapi/search/places",
          rectList, // Body: ["left,bottom,right,top", ...]
          { params: { query }, signal: ctrl.signal }
        );

        console.timeEnd("[POST /places/rects]");
        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const deduped = dedupeById(raw);
        if (!cancelled) setPlaces(deduped);
      } catch (err) {
        if (cancelled || err.name === "CanceledError") return;
        console.error("[/places/rects] error", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        if (!cancelled) {
          setError(err);
          setPlaces(EMPTY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [query, rectList]); // rectList는 useMemo로 regionId 바뀔 때만 변경

  return { places, loading, error, rectList };
}

// // src/hooks/useMapSearchPlaces.js
// import { useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
// import mapPoints from "../data/mapPoints";

// function dedupeById(list) {
//   const seen = new Set();
//   const out = [];
//   for (const item of list || []) {
//     const id = item?.id ?? item?.place_id ?? JSON.stringify(item);
//     if (!seen.has(id)) { seen.add(id); out.push(item); }
//   }
//   return out;
// }

// /** Kakao 장소 검색 (백엔드 /places/rects 사용) */
// export default function useMapSearchPlaces(query, regionId) {
//   const [places, setPlaces] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError]   = useState(null);

//   // regionId → rectList
//   const rectList = useMemo(() => {
//     const arr = mapPoints?.[regionId];
//     console.groupCollapsed(
//       "%c[useMapSearchPlaces] regionId→rectList",
//       "color:#4f46e5;font-weight:700"
//     );
//     console.log("regionId:", regionId);
//     console.log("rectList exists:", Array.isArray(arr));
//     console.log("rectList length:", Array.isArray(arr) ? arr.length : 0);
//     if (Array.isArray(arr) && arr.length) {
//       console.log("rectList sample (first 3):", arr.slice(0, 3));
//       console.log("rectList sample (last 1):", arr.slice(-1));
//     }
//     console.groupEnd();
//     return Array.isArray(arr) ? arr : [];
//   }, [regionId]);

//   // query/region 바뀌면 초기화
//   const prevKeyRef = useRef("");
//   useEffect(() => {
//     const key = JSON.stringify({ query, regionId, rectCount: rectList.length });
//     if (prevKeyRef.current !== key) {
//       prevKeyRef.current = key;
//       setPlaces([]);
//       setError(null);
//       console.log(
//         "[useMapSearchPlaces] deps changed → reset",
//         { query, regionId, rectCount: rectList.length }
//       );
//     }
//   }, [query, regionId, rectList.length]);

//   // 호출
//   useEffect(() => {
//     if (!query) {
//       console.warn("[useMapSearchPlaces] skip: empty query");
//       setPlaces([]);
//       return;
//     }
//     if (rectList.length === 0) {
//       console.warn("[useMapSearchPlaces] skip: rectList empty for regionId:", regionId);
//       setPlaces([]);
//       return;
//     }

//     const ctrl = new AbortController();
//     let cancelled = false;

//     (async () => {
//       setLoading(true);
//       setError(null);
//       console.time("[/places/rects] request time");
//       console.log("[/places/rects] start", { query, rectCount: rectList.length });

//       try {
//         const res = await axios.post(
//           "http://localhost:8080/places/rects",
//           rectList,                               // Body: JSON 배열
//           { params: { query }, headers:{ "Content-Type":"application/json" }, signal: ctrl.signal }
//         );

//         console.timeEnd("[/places/rects] request time");
//         console.log("[/places/rects] status/dataType:", res.status, Array.isArray(res.data) ? "array" : typeof res.data);

//         const raw = Array.isArray(res.data)
//           ? res.data
//           : Array.isArray(res.data?.data) ? res.data.data : [];

//         console.log("[/places/rects] raw length:", raw.length);
//         const deduped = dedupeById(raw);
//         console.log("[/places/rects] deduped length:", deduped.length);

//         if (!cancelled) setPlaces(deduped);
//       } catch (err) {
//         if (cancelled || err.name === "CanceledError") return;
//         console.error(
//           "[/places/rects] error",
//           {
//             message: err.message,
//             status: err.response?.status,
//             data: err.response?.data
//           }
//         );
//         setError(err);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     })();

//     return () => { cancelled = true; ctrl.abort(); };
//   }, [query, rectList, regionId]);

//   return { places, loading, error };
// }
