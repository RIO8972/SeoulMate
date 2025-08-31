import React from "react";
import styles from "./Weather.module.css";

const fmt = (v, suffix = "") =>
  v === null || v === undefined || v === "" || v === "-" ? "-" : `${v}${suffix}`;

const airLevel = (score) => {
  const n = Number(score);
  if (Number.isNaN(n)) return "정보없음";
  if (n <= 50) return "좋음";
  if (n <= 100) return "보통";
  if (n <= 250) return "나쁨";
  return "매우나쁨";
};

const levelClass = (label) => {
  switch (label) {
    case "좋음":
      return styles.good;
    case "보통":
      return styles.soso;
    case "나쁨":
      return styles.bad;
    case "매우나쁨":
      return styles.terrible;
    default:
      return styles.na;
  }
};

// 아주 간단한 날씨 아이콘 매핑(이미지 경로 없을 때 이모지 사용)
const skyIcon = (txt) => {
  const t = String(txt || "").trim();
  if (t.includes("비")) return "🌧️";
  if (t.includes("눈")) return "🌨️";
  if (t.includes("흐림")) return "☁️";
  if (t.includes("구름")) return "⛅️";
  return "🌙";
};

const Weather = ({ weatherData = [], forecastData }) => {
  const d = weatherData?.[0];
  if (!d) return <div className={styles.container}><p>날씨 데이터 없음</p></div>;

  const airIdxLabel = airLevel(d.AIR_IDX);
  const pm10Label = d.PM10_INDEX || airLevel(d.PM10);
  const pm25Label = d.PM25_INDEX || airLevel(d.PM25);

  // 24시간 예보(여러 케이스 대응)
  const fcstRaw =
    forecastData ??
    d.FCST24HOURS ??
    d.FORECAST_24H ??
    d.FORECAST ??
    d.HOURLY ??
    [];

  // FCST_DT(YYYYMMDDHHmm) → HH (두 자리)
  const fcst = fcstRaw.map((o) => {
    const hh =
      o.hour ??
      (o.FCST_DT ? o.FCST_DT.slice(8, 10) : o.TIME ?? "");
    return {
      hh: String(hh).padStart(2, "0"),
      temp: o.temp ?? o.TEMP ?? "-",
      rainMm: o.PRECIPITATION ?? o.rainMm ?? "-",
      rainProb: o.RAIN_CHANCE ?? o.RAIN_PROB ?? "-",
      sky: o.SKY_STTS ?? o.SKY ?? o.WEATHER ?? "",
    };
  });

  return (
    <div className={styles.container}>
      {/* 상단바 */}
      <div className={styles.headerBar}>
        <div className={styles.refreshRow}>
          <span className={styles.rptDate}>{fmt(d.WEATHER_TIME)} 기준</span>
          <button className={styles.refreshBtn} aria-label="새로고침">⟲</button>
        </div>
        <h2 className={styles.h2}>
          {/* <span className={styles.hotspotNm}>POI</span>{" "} */}
          <span className={styles.txtGray}>날씨 / 환경 현황</span>
        </h2>
      </div>

      <div className={styles.inner}>
        {/* 실시간 날씨 */}
        <div className={styles.card}>
          <h3 className={`${styles.h3} ${styles.borderBottom}`}>
            실시간 날씨 현황
            <span className={styles.rightNote}>※ {fmt(d.WEATHER_TIME)} 기준</span>
          </h3>

          {/* 현재 기온 */}
          <div className={styles.temperature}>
            {/* <span className={styles.iconEmoji} aria-hidden>🌡️</span> */}
            <b className={`${styles.tempNow} ${styles.primary}`}>{fmt(d.TEMP, "℃")}</b>
            <span className={styles.feels}>체감 {fmt(d.SENSIBLE_TEMP, "℃")}</span>
          </div>

          {/* 습도 / 바람 (줄바꿈 방지) */}
          <div className={`${styles.row2} ${styles.mt3}`}>
            <div className={`${styles.col} ${styles.textRight} ${styles.borderRight}`}>
              {/* <span className={styles.iconEmoji} aria-hidden>💧</span> */}
              <span className={styles.nowrap}>습도 <b className={styles.bold}>{fmt(d.HUMIDITY, "%")}</b></span>
            </div>
            <div className={`${styles.col} ${styles.textLeft}`}>
              {/* <span className={styles.iconEmoji} aria-hidden>🍃</span> */}
              <span className={styles.nowrap}>바람 <b className={styles.bold}>{fmt(d.WIND_SPD, "m/s")}</b></span>
            </div>
          </div>

    {/* ✅ ‘필 카드’ 스타일의 최저/최고/일출/일몰 */}
      <div className={styles.row}>
        <div className={styles.pillRow} role="list">
          <div className={`${styles.pill} ${styles.pillBlue}`} role="listitem">
            <span className={styles.pillLabel}>최저기온</span>
            <span className={styles.pillValue}>{fmt(d.MIN_TEMP, "℃")}</span>
          </div>
          <div className={`${styles.pill} ${styles.pillBlue}`} role="listitem">
            <span className={styles.pillLabel}>최고기온</span>
            <span className={styles.pillValue}>{fmt(d.MAX_TEMP, "℃")}</span>
          </div>
          <div className={`${styles.pill} ${styles.pillSun}`} role="listitem">
            <span className={styles.pillLabel}>일출</span>
            <span className={`${styles.pillValue} ${styles.sunValue}`}>{fmt(d.SUNRISE)}</span>
          </div>
          <div className={`${styles.pill} ${styles.pillSun}`} role="listitem">
            <span className={styles.pillLabel}>일몰</span>
            <span className={`${styles.pillValue} ${styles.sunValue}`}>{fmt(d.SUNSET)}</span>
          </div>
        </div>
      </div>

          {/* 강수/자외선 */}
          <div className={`${styles.weatherRow} ${styles.borderBottom}`}>
            <div className={styles.iconCell} aria-hidden>🌂</div>
            <div className={`${styles.mwLabel} ${styles.borderRight}`}>
              강수량<br/><b className={styles.colorBk}>{fmt(d.PRECIPITATION)}</b>
            </div>
            <div className={styles.flexMsg}>{d.PCP_MSG || "강수 정보 없음"}</div>
          </div>
          <div className={styles.weatherRow}>
            <div className={styles.iconCell} aria-hidden>☀️</div>
            <div className={`${styles.mwLabel} ${styles.borderRight}`}>
              자외선지수<br/>
              <b className={styles.colorBk}>
                <span className={`${styles.badge} ${styles.good}`}>{d.UV_INDEX ?? "-"}</span>{" "}
                <span className={styles.badgeLite}>{d.UV_INDEX_LVL ?? "-"}</span>
              </b>
            </div>
            <div className={styles.flexMsg}>{d.UV_MSG || "자외선 정보 없음"}</div>
          </div>

          {/* 24시간 예보 */}
          {fcst.length > 0 && (
            <>
              <h4 className={`${styles.h4} ${styles.mt2}`}>24시간 날씨 예보</h4>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <th>시간</th>
                      {fcst.map((h, i) => <td key={`h-${i}`}>{h.hh}시</td>)}
                    </tr>
                    <tr>
                      <th>날씨</th>
                      {fcst.map((h, i) => <td key={`w-${i}`}>{skyIcon(h.sky)}</td>)}
                    </tr>
                    <tr>
                      <th>기온(℃)</th>
                      {fcst.map((h, i) => <td key={`t-${i}`}>{h.temp}</td>)}
                    </tr>
                    <tr>
                      <th>강수량(mm)</th>
                      {fcst.map((h, i) => <td key={`r-${i}`}>{h.rainMm}</td>)}
                    </tr>
                    <tr>
                      <th>강수확률(%)</th>
                      {fcst.map((h, i) => <td key={`p-${i}`}>{h.rainProb}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* 대기오염 현황 */}
        <div className={styles.card}>
          <h3 className={`${styles.h3} ${styles.borderBottom}`}>
            대기오염 현황
            <span className={styles.rightNote}>※ {fmt(d.WEATHER_TIME)} 기준</span>
          </h3>

          <div className={styles.airTitleRow}>
            <strong className={styles.airTitle}>통합대기환경지수</strong>
            <span className={`${styles.wAllBadge} ${levelClass(airIdxLabel)}`}>{airIdxLabel}</span>
          </div>

          <ul className={`${styles.descList} ${styles.mt2}`}>
            <li>{d.AIR_MSG || "대기질 정보를 확인하세요."}</li>
          </ul>

          {/* PM 카드 2열: 줄바꿈 방지 */}
          <div className={styles.pmGrid}>
            <div className={styles.pmItem}>
              <span className={styles.pmLabel}>미세먼지</span>
              <span className={`${styles.pmBadge} ${levelClass(pm10Label)}`}>
                <span className={styles.pmValue}>{fmt(d.PM10, "")}</span>
                <span className={styles.unit}>㎍/㎥</span>
              </span>
              <span className={`${styles.pmLevel} ${levelClass(pm10Label)}`}></span>
            </div>
            <div className={styles.pmItem}>
              <span className={styles.pmLabel}>초미세먼지</span>
              <span className={`${styles.pmBadge} ${levelClass(pm25Label)}`}>
                <span className={styles.pmValue}>{fmt(d.PM25, "")}</span>
                <span className={styles.unit}>㎍/㎥</span>
              </span>
              <span className={`${styles.pmLevel} ${levelClass(pm25Label)}`}></span>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Weather;





// import React from 'react';

// const Weather = ({ weatherData }) => {
//   // 배열에서 첫 번째 객체 꺼내기
//   const data = weatherData[0];

//   if (!data) return <p>날씨 데이터 없음</p>;

//   return (
//     <div>
//       <h3>날씨 정보</h3>
//       <p>측정 시각: {data.WEATHER_TIME}</p>
//       <p>현재 기온: {data.TEMP}℃</p>
//       <p>체감 온도: {data.SENSIBLE_TEMP}℃</p>
//       <p>최고 기온: {data.MAX_TEMP}℃</p>
//       <p>최저 기온: {data.MIN_TEMP}℃</p>
//       <p>습도: {data.HUMIDITY}%</p>
//       <p>강수 형태: {data.PRECPT_TYPE}</p>
//       <p>강수량: {data.PRECIPITATION}</p>
//       <p>바람 방향: {data.WIND_DIRCT}</p>
//       <p>바람 속도: {data.WIND_SPD} m/s</p>
//       <p>미세먼지(PM10): {data.PM10} ({data.PM10_INDEX})</p>
//       <p>초미세먼지(PM2.5): {data.PM25} ({data.PM25_INDEX})</p>
//       <p>공기질 지수: {data.AIR_IDX} ({data.AIR_IDX_MAIN} / {data.AIR_IDX_MVL})</p>
//       <p>공기질 메시지: {data.AIR_MSG}</p>
//       <p>자외선 지수: {data.UV_INDEX} ({data.UV_INDEX_LVL})</p>
//       <p>자외선 메시지: {data.UV_MSG}</p>
//       <p>강수 메시지: {data.PCP_MSG}</p>
//       <p>일출: {data.SUNRISE}</p>
//       <p>일몰: {data.SUNSET}</p>
//     </div>
//   );
// };

// export default Weather;
