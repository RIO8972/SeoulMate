// src/components/Event/Event.js
//https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CT1&x=126.916493990351&y=37.5508138163956&radius=100&sort=distance&size=1
import React, { useMemo, useCallback } from "react";
import axios from "axios";
import styles from "./Event.module.css";

/** yyyy-mm-dd~yyyy-mm-dd 형태를 파싱해서 진행중 여부 계산 */
const isOngoing = (periodStr) => {
  if (!periodStr || typeof periodStr !== "string") return null;
  const [s, e] = periodStr.split("~").map((x) => x?.trim());
  if (!s || !e) return null;
  const start = new Date(s);
  const end = new Date(e);
  end.setHours(23, 59, 59, 999); // 종료일 23:59:59
  const now = new Date();
  return now >= start && now <= end;
};

const Event = ({ event = [] , onSavePlace}) => {
  // rows: 최대 50개
  const rows = useMemo(() => {
    const list = Array.isArray(event) ? event : event?.EVENT_STTS;
    return Array.isArray(list) ? list.slice(0, 50) : [];
  }, [event]);

// 카카오 카테고리 검색(전시장 CT1) → 빈 배열이면 키워드 검색으로 폴백
const handleCategorySearch = useCallback(async (ev) => {
  try {
    const REST_KEY =
      process.env.REACT_APP_KAKAO_REST_KEY ||
      import.meta.env?.VITE_KAKAO_REST_KEY;

    if (!REST_KEY) {
      console.warn("Kakao REST API Key not found in env");
    }

    const headers = { Authorization: `KakaoAK ${REST_KEY || "ecee90558612019792b396dee93aadb8"}` };

    // 1) 카테고리(CT1)로 좌표 주변 1건
    const catRes = await axios.get(
      "https://dapi.kakao.com/v2/local/search/category.json",
      {
        headers,
        params: {
          category_group_code: "CT1",
          x: ev.EVENT_X, // 경도
          y: ev.EVENT_Y, // 위도
          radius: 100,
          sort: "distance",
          size: 1,
        },
      }
    );
    const catDoc = catRes?.data?.documents?.[0];

    if (catDoc) {
      console.log("[Kakao CT1 nearest result]", ev.EVENT_NM, catDoc);
      if (typeof onSavePlace === "function") {
        onSavePlace(ev, catDoc, "category");
      }
      return;
    }

    // 2) 폴백: 키워드(관광명소) + 반경 1km, 거리순 1건
    const kwRes = await axios.get(
      "https://dapi.kakao.com/v2/local/search/keyword.json",
      {
        headers,
        params: {
          query: "관광명소",
          x: ev.EVENT_X,
          y: ev.EVENT_Y,
          radius: 1000,
          sort: "distance",
          size: 1,
        },
      }
    );
    const kwDoc = kwRes?.data?.documents?.[0];

    console.log("[Kakao fallback keyword result]", ev.EVENT_NM, kwDoc ?? kwRes?.data);

    if (kwDoc && typeof onSavePlace === "function") {
      onSavePlace(ev, kwDoc, "keyword");
    }
  } catch (err) {
    console.error("Kakao category/keyword search error:", err);
  }
}, [onSavePlace]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>문화행사</h3>
        {/* <span className={styles.updatedAt}>최대 50건 표시</span> */}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>행사명</th>
              <th></th>
              <th></th>
              {/* <th>기간</th> */}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.empty}>
                  데이터 없음
                </td>
              </tr>
            ) : (
              rows.map((ev, i) => {
                const name = ev.EVENT_NM || "-";
                const period = ev.EVENT_PERIOD || "-";
                const url = ev.URL || null;
                const thumb = ev.THUMBNAIL || null;
                const ongoing = isOngoing(period);

                return (
                  <tr key={`${name}-${i}`}>
                    <td>
                      {thumb ? (
                        <img
                          className={styles.thumb}
                          src={thumb}
                          alt={name}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder}>No Image</div>
                      )}
                    </td>
                    <td className={styles.eventName}>
                      <div className={styles.nameRow}>
                        {url ? (
                          <a
                            className={styles.link}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            title={name}
                          >
                            {name}
                          </a>
                        ) : (
                          <span className={styles.namePlain}>{name}</span>
                        )}
                        {ongoing === true && (
                          <span className={`${styles.badge} ${styles.badgeNow}`}>
                            진행중
                          </span>
                        )}
                        {ongoing === false && (
                          <span className={`${styles.badge} ${styles.badgeDone}`}>
                            종료
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className={styles.addButton} onClick={() => handleCategorySearch(ev)}>
                        + 
                      </button>
                    </td>
                    {/* <td>{period}</td> */}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className={styles.note}>※ 진행 상태는 기간 기준으로 단순 계산됩니다.</div>
      </div>
    </div>
  );
};

export default Event;


// import React, { useMemo } from "react";
// import styles from "./Event.module.css";

// /** yyyy-mm-dd~yyyy-mm-dd 형태를 파싱해서 진행중 여부 계산 */
// const isOngoing = (periodStr) => {
//   if (!periodStr || typeof periodStr !== "string") return null;
//   const [s, e] = periodStr.split("~").map((x) => x?.trim());
//   if (!s || !e) return null;
//   const start = new Date(s);
//   const end = new Date(e);
//   end.setHours(23, 59, 59, 999); // 종료일 23:59:59
//   const now = new Date();
//   return now >= start && now <= end;
// };

// const Event = ({ event = [] }) => {
//   // rows: 최대 50개
//   const rows = useMemo(() => {
//     const list = Array.isArray(event) ? event : event?.EVENT_STTS;
//     return Array.isArray(list) ? list.slice(0, 50) : [];
//   }, [event]);

//   return (
//     <div className={styles.container}>
//       <div className={styles.headerRow}>
//         <h3 className={styles.title}>문화행사</h3>
//         <span className={styles.updatedAt}>최대 50건 표시</span>
//       </div>

//       <div className={styles.tableWrap}>
//         <table className={styles.table}>
//           <thead>
//             <tr>
//               <th>썸네일</th>
//               <th>행사명</th>
//               {/* <th>기간</th> */}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.length === 0 ? (
//               <tr>
//                 <td colSpan={3} className={styles.empty}>데이터 없음</td>
//               </tr>
//             ) : (
//               rows.map((ev, i) => {
//                 const name = ev.EVENT_NM || "-";
//                 const period = ev.EVENT_PERIOD || "-";
//                 const url = ev.URL || null;
//                 const thumb = ev.THUMBNAIL || null;
//                 const ongoing = isOngoing(period);

//                 return (
//                   <tr key={`${name}-${i}`}>
//                     <td>
//                       {thumb ? (
//                         <img
//                           className={styles.thumb}
//                           src={thumb}
//                           alt={name}
//                           loading="lazy"
//                         />
//                       ) : (
//                         <div className={styles.thumbPlaceholder}>No Image</div>
//                       )}
//                     </td>
//                     <td className={styles.eventName}>
//                       <div className={styles.nameRow}>
//                         {url ? (
//                           <a
//                             className={styles.link}
//                             href={url}
//                             target="_blank"
//                             rel="noreferrer"
//                             title={name}
//                           >
//                             {name}
//                           </a>
//                         ) : (
//                           <span>{name}</span>
//                         )}
//                         {ongoing === true && (
//                           <span className={`${styles.badge} ${styles.badgeNow}`}>
//                             진행중
//                           </span>
//                         )}
//                         {ongoing === false && (
//                           <span className={`${styles.badge} ${styles.badgeDone}`}>
//                             종료
//                           </span>
//                         )}
//                       </div>
//                     </td>
//                     {/* <td>{period}</td> */}
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//         <div className={styles.note}>
//           ※ 진행 상태는 기간 기준으로 단순 계산됩니다.
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Event;


// import React, { useMemo } from "react";
// import styles from "./Event.module.css";

// /** 안전 숫자 파서 */
// const toNum = (v) =>
//   v === null || v === undefined || v === "" || isNaN(Number(v))
//     ? null
//     : Number(v);

// /** yyyy-mm-dd~yyyy-mm-dd 형태를 파싱해서 진행중 여부 계산 */
// const isOngoing = (periodStr) => {
//   if (!periodStr || typeof periodStr !== "string") return null;
//   const [s, e] = periodStr.split("~").map((x) => x?.trim());
//   if (!s || !e) return null;
//   const start = new Date(s);
//   // 종료일 23:59:59 처리
//   const end = new Date(e);
//   end.setHours(23, 59, 59, 999);
//   const now = new Date();
//   return now >= start && now <= end;
// };

// const Event = ({ event = [] }) => {
//   // rows: 최대 50개
//   const rows = useMemo(() => {
//     const list = Array.isArray(event) ? event : event?.EVENT_STTS;
//     return Array.isArray(list) ? list.slice(0, 50) : [];
//   }, [event]);

//   return (
//     <div className={styles.container}>
//       <div className={styles.headerRow}>
//         <h3 className={styles.title}>문화행사</h3>
//         <span className={styles.updatedAt}>최대 50건 표시</span>
//       </div>

//       <div className={styles.tableWrap}>
//         <table className={styles.table}>
//           <thead>
//             <tr>
//               <th>썸네일</th>
//               <th>행사명</th>
//               <th>기간</th>
//               <th>장소</th>
//               <th>링크</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.length === 0 ? (
//               <tr>
//                 <td colSpan={5} className={styles.empty}>데이터 없음</td>
//               </tr>
//             ) : (
//               rows.map((ev, i) => {
//                 const name = ev.EVENT_NM || "-";
//                 const period = ev.EVENT_PERIOD || "-";
//                 const place = ev.EVENT_PLACE || "-";
//                 const url = ev.URL || null;
//                 const thumb = ev.THUMBNAIL || null;
//                 const ongoing = isOngoing(period);

//                 return (
//                   <tr key={`${name}-${i}`}>
//                     <td>
//                       {thumb ? (
//                         <img
//                           className={styles.thumb}
//                           src={thumb}
//                           alt={name}
//                           loading="lazy"
//                         />
//                       ) : (
//                         <div className={styles.thumbPlaceholder}>No Image</div>
//                       )}
//                     </td>
//                     <td className={styles.eventName}>
//                       <div className={styles.nameRow}>
//                         <span>{name}</span>
//                         {ongoing === true && (
//                           <span className={`${styles.badge} ${styles.badgeNow}`}>
//                             진행중
//                           </span>
//                         )}
//                         {ongoing === false && (
//                           <span className={`${styles.badge} ${styles.badgeDone}`}>
//                             종료
//                           </span>
//                         )}
//                       </div>
//                     </td>
//                     <td>{period}</td>
//                     <td className={styles.addr}>{place}</td>
//                     <td>
//                       {url ? (
//                         <a
//                           className={styles.link}
//                           href={url}
//                           target="_blank"
//                           rel="noreferrer"
//                         >
//                           바로가기
//                         </a>
//                       ) : (
//                         "-"
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//         <div className={styles.note}>
//           ※ 진행 상태는 기간 기준으로 단순 계산됩니다.
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Event;
