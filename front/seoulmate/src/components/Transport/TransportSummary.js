// TransportSummary.jsx
import React, { useMemo } from "react";
import styles from "./TransportSummary.module.css";

/** 안전 숫자 변환: null/undefined/""/"null" → null, 그 외 숫자만 number */
const toNum = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "" || t === "null" || t === "nan") return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 합산(둘 다 null이면 null) */
const sumNullable = (a, b) => {
  const na = toNum(a);
  const nb = toNum(b);
  if (na == null && nb == null) return null;
  return (na || 0) + (nb || 0);
};
/** 중간값(“약 … 명”) */
const approxMid = (min, max) => {
  const nmin = toNum(min);
  const nmax = toNum(max);
  if (nmin != null && nmax != null) return Math.round(((nmin + nmax) / 2) / 10) * 10;
  if (nmin != null) return nmin;
  if (nmax != null) return nmax;
  return null;
};
const fmt = (n) => (n == null ? "—" : n.toLocaleString());

/**
 * 실시간 대중교통(지하철+버스) 승하차 요약 카드
 * props:
 *  - data: placeData 전체 객체 (LIVE_SUB_PPLTN, LIVE_BUS_PPLTN 포함)
 */
export default function TransportSummary({ data }) {
  const sub = data?.LIVE_SUB_PPLTN ?? {};
  const bus = data?.LIVE_BUS_PPLTN ?? {};

  // 각 소스에 "숫자 데이터가 하나라도 있는지" 검사
  const hasSubData = useMemo(
    () => Object.values(sub).some((v) => toNum(v) != null),
    [sub]
  );
  const hasBusData = useMemo(
    () => Object.values(bus).some((v) => toNum(v) != null),
    [bus]
  );

  // ✅ 요구사항: 버스/지하철 중 하나라도 미제공이면 전체 제공불가 처리
  const noService = !hasSubData || !hasBusData;

  // 최근 30분 승/하차 합산(두 소스 모두 제공될 때만 의미 있음)
  const rideMin = useMemo(
    () => sumNullable(sub.SUB_30WTHN_GTON_PPLTN_MIN, bus.BUS_30WTHN_GTON_PPLTN_MIN),
    [sub, bus]
  );
  const rideMax = useMemo(
    () => sumNullable(sub.SUB_30WTHN_GTON_PPLTN_MAX, bus.BUS_30WTHN_GTON_PPLTN_MAX),
    [sub, bus]
  );
  const alitMin = useMemo(
    () => sumNullable(sub.SUB_30WTHN_GTOFF_PPLTN_MIN, bus.BUS_30WTHN_GTOFF_PPLTN_MIN),
    [sub, bus]
  );
  const alitMax = useMemo(
    () => sumNullable(sub.SUB_30WTHN_GTOFF_PPLTN_MAX, bus.BUS_30WTHN_GTOFF_PPLTN_MAX),
    [sub, bus]
  );

  const rideApprox = approxMid(rideMin, rideMax);
  const alitApprox = approxMid(alitMin, alitMax);

  // 30분 구간 값 자체가 모두 없는 경우
  const no30mData =
    rideMin == null && rideMax == null && alitMin == null && alitMax == null;

  // 유출/유입 라벨 & 값 (+ 유입 여부)
  let flowLabel = "인구 유출";
  let flowValue = null;
  let isInflow = false;
  if (rideApprox != null && alitApprox != null) {
    const diff = rideApprox - alitApprox;
    if (diff < 0) {
      flowLabel = "인구 유입";
      flowValue = Math.abs(diff);
      isInflow = true;
    } else {
      flowValue = diff;
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.title}>
          <span
            className={styles.anchor}
            title="실시간 대중교통 (지하철, 버스) 승하차"
          >
            실시간 대중교통 (지하철, 버스) 승하차
          </span>
          <span className={styles.chev} aria-hidden>›</span>
        </div>
        <div className={styles.caption}>*최근 30분 기준</div>
      </div>

      {noService ? (
        <div className={styles.noData}>해당 지역은 버스/지하철 정보가 제공되지 않습니다.</div>
      ) : no30mData ? (
        <div className={styles.noData}>최근 30분 데이터 없음</div>
      ) : (
        <div className={styles.mainRow}>
          <div className={styles.block}>
            <div className={`${styles.blockLabel} ${styles.blockLabelBlue}`}>승차</div>
            <div className={styles.bigNum}>약 {fmt(rideApprox)} 명</div>
          </div>

          <div className={styles.flow}>
            <div className={`${styles.flowText} ${isInflow ? styles.flowTextBlue : ""}`}>
              {flowLabel.split(" ").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 ? <br /> : null}
                </span>
              ))}
            </div>
            <div className={styles.flowBadge}>{fmt(flowValue)}</div>
          </div>

          <div className={styles.block}>
            <div className={styles.blockLabel}>하차</div>
            <div className={styles.bigNumDark}>약 {fmt(alitApprox)} 명</div>
          </div>
        </div>
      )}
    </div>
  );
}





          {/* <div className={styles.rangeRow}>
            <div className={styles.rangeBox}>{fmtRange(rideMin, rideMax)}</div>
            <div className={styles.rangeGap} />
            <div className={styles.rangeBox}>{fmtRange(alitMin, alitMax)}</div>
          </div> */}