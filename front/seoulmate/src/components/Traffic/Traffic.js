import React, { useMemo } from "react";
import styles from "./Traffic.module.css";

/** 숫자 파서 */
const toNum = (v) =>
  v === null || v === undefined || v === "" || isNaN(Number(v))
    ? null
    : Number(v);

/** 따릉이: 잔여(빈 슬롯)/총, 거치율(= 빈 슬롯 비율) */
const calcBike = (b) => {
  const total = toNum(b.SBIKE_RACK_CNT) ?? 0; // 거치대 수(총)
  const empty = toNum(b.SBIKE_PARKING_CNT); // 주차가능 대수(빈 슬롯)
  if (empty === null || total === 0) {
    return { empty: "-", total, freeRate: "-" };
  }
  const freeRate = Math.round((empty / total) * 100); // cap 없이 그대로
  return { empty, total, freeRate };
};

/** 거치율 색상 클래스 */
const rateClass = (r) => {
  if (r === "-") return styles.rateNA;
  if (r < 30) return styles.rateLow; // 빨강
  if (r < 70) return styles.rateMid; // 주황
  return styles.rateHigh; // 초록
};

const Traffic = ({ parkingData = [], sbikeData = [] }) => {
  // 주차장 표 데이터 (최대 50)
  const parkingRows = useMemo(() => {
    const items = Array.isArray(parkingData) ? parkingData : [];
    return items.slice(0, 50);
  }, [parkingData]);

  // 따릉이 표 데이터 (최대 50)
  const bikeRows = useMemo(() => {
    const items = Array.isArray(sbikeData) ? sbikeData : [];
    return items.slice(0, 50);
  }, [sbikeData]);

  return (
    <div className={styles.container}>
      {/* 주차장 표: 수용 가능 면수만 표시 */}
      <div className={styles.tableWrap}>
        <h2 className={styles.subTitle}>주차장 정보</h2>
        <table className={`${styles.table} ${styles.parkingTable}`}>
          {/* 열 고정: 주차장명 56% / 면수 14% / 위치 30% */}
          <colgroup>
            <col className={styles.colParkName} />
            <col className={styles.colParkCap} />
            <col className={styles.colParkAddr} />
          </colgroup>
          <thead>
            <tr>
              <th>주차장명</th>
              <th>수용 가능 면수</th>
              <th>위치</th>
            </tr>
          </thead>
          <tbody>
            {parkingRows.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.empty}>
                  데이터 없음
                </td>
              </tr>
            ) : (
              parkingRows.map((p, i) => {
                const total =
                  p.CPCTY == null || p.CPCTY === "" ? "-" : Number(p.CPCTY);
                const addr = p.ROAD_ADDR || p.ADDRESS || "주소 정보 없음";
                return (
                  <tr key={`${p.PRK_CD ?? "noid"}-${i}`}>
                    <td>{p.PRK_NM}</td>
                    <td className={styles.availCell}>{total}</td>
                    <td className={styles.addr}>{addr}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className={styles.note}>
          ※ 실시간 주차 현황 미제공 → 수용 가능 면수(CPCTY)만 표시합니다.
        </div>
      </div>

      {/* 따릉이 표: 잔여/총 + 거치율(빈 자리 비율) */}
      <div className={styles.section}>
        <h4 className={styles.subTitle}>따릉이 거치소 정보</h4>
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.bikeTable}`}>
            {/* 열 고정: 거치소명 60% / 잔여총 20% / 거치율 20% */}
            <colgroup>
              <col className={styles.colBikeName} />
              <col className={styles.colBikeAvail} />
              <col className={styles.colBikeRate} />
            </colgroup>
            <thead>
              <tr>
                <th>거치소명</th>
                <th>잔여/총</th>
                <th>거치율</th>
              </tr>
            </thead>
            <tbody>
              {bikeRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.empty}>
                    데이터 없음
                  </td>
                </tr>
              ) : (
                bikeRows.map((b, i) => {
                  const { empty, total, freeRate } = calcBike(b);
                  const availDisplay = total
                    ? `${empty === "-" ? "-" : empty}/${total}`
                    : empty ?? "-";
                  return (
                    <tr key={`${b.SBIKE_SPOT_ID ?? "noid"}-${i}`}>
                      <td>{b.SBIKE_SPOT_NM}</td>
                      <td className={styles.availCell}>{availDisplay}</td>
                      <td
                        className={`${styles.availCell} ${rateClass(freeRate)}`}
                      >
                        {freeRate === "-" ? "-" : `${freeRate}%`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className={styles.note}>※ 잔여/총 = 주차가능 대수/거치대 수</div>
        </div>
      </div>
    </div>
  );
};

export default Traffic;

// import React from 'react';

// const Traffic = ({parkingData, sbikeData}) => {
//     console.log(parkingData);
//     console.log(sbikeData);
//     return (
//     <>
//       <h3>따릉이 거치소 정보</h3>
//       {sbikeData.map((sbike, index) => (
//         <div key={`sbike-${sbike?.SBIKE_SPOT_ID ?? 'noid'}-${index}`}>
//           <p>거치소명: {sbike.SBIKE_SPOT_NM}</p>
//           <p>거치소 ID: {sbike.SBIKE_SPOT_ID}</p>
//           <p>공유율: {sbike.SBIKE_SHARED}%</p>
//           <p>주차 가능 대수: {sbike.SBIKE_PARKING_CNT}</p>
//           <p>거치대 수: {sbike.SBIKE_RACK_CNT}</p>
//           <hr />
//         </div>
//       ))}

//       <h3>주차장 정보</h3>
//       {parkingData.map((park, index) => (
//         <div key={`park-${park?.PRK_CD ?? 'noid'}-${index}`}>
//           <div>주차장명: {park.PRK_NM}</div>
//           {/* <p>주차장 코드: {park.PRK_CD}</p> */}
//           <div>유형: {park.PRK_TYPE}</div>
//           {/* <p>주소: {park.ADDRESS || park.ROAD_ADDR || '주소 정보 없음'}</p> */}
//           {/* <p>위도: {park.LAT}</p>
//           <p>경도: {park.LNG}</p> */}
//           <div>총 주차 가능 대수: {park.CPCTY}</div>
//           <div>현재 주차 대수: {park.CUR_PRK_CNT || '정보 없음'}</div>
//           <div>유료 여부: {park.PAY_YN === 'Y' ? '유료' : '무료'}</div>
//           <div>기본 요금: {park.RATES}원 / {park.TIME_RATES}분</div>
//           <div>추가 요금: {park.ADD_RATES}원 / {park.ADD_TIME_RATES}분</div>
//           <hr />
//         </div>
//       ))}
//     </>
//     )
// }
// export default Traffic;
