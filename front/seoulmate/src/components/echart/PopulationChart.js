import React, { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";

const PopulationChart = ({ info }) => {
  const [option, setOption] = useState(null);

  // ── 유틸
  const fmtNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : "-";
  };
  const levelColor = (lvlRaw) => {
    const lvl = String(lvlRaw || "").trim();
    if (lvl === "붐빔") return "#d32f2f";
    if (lvl === "약간 붐빔") return "#f57c00";
    if (lvl === "보통") return "#fbc02d";
    return "#388e3c"; // 원활/여유 등
  };
  const msgLines = useMemo(() => {
    const raw = String(info?.AREA_CONGEST_MSG || "").trim();
    if (!raw) return [];
    return raw
      .split(/(?<=\.)\s*/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [info?.AREA_CONGEST_MSG]);

  const areaName = info?.AREA_NM || "지역";
  const level = (info?.AREA_CONGEST_LVL || "—").trim();
  const popMin = fmtNum(info?.AREA_PPLTN_MIN);
  const popMax = fmtNum(info?.AREA_PPLTN_MAX);

  const hasForecast =
    Array.isArray(info?.FCST_PPLTN) && info.FCST_PPLTN.length > 0;

  // ── 차트 옵션
  const getBarOption = (xAxis, data, ariaLabel) => {
    const maxnum = data.reduce(
      (m, d) => Math.max(m, Number(d.FCST_PPLTN_MAX) || 0),
      0
    );
    const safeMax = Math.max(1, maxnum);
    const mid = Math.floor(xAxis.length / 2);
    const last = xAxis.length - 1;

    const seriesData = data.map((d) => {
      let color;
      switch (d.FCST_CONGEST_LVL?.trim()) {
        case "붐빔":
          color = "#d32f2f";
          break;
        case "약간 붐빔":
          color = "#f57c00";
          break;
        case "보통":
          color = "#fbc02d";
          break;
        default:
          color = "#388e3c";
      }
      return { value: Number(d.FCST_PPLTN_MAX) || 0, itemStyle: { color } };
    });

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { top: "15%", left: "5%", right: "5%", bottom: "15%", containLabel: true },
      xAxis: [
        {
          type: "category",
          data: xAxis,
          axisTick: { show: false },
          axisLabel: {
            interval: 0,
            showMinLabel: true,
            showMaxLabel: true,
            formatter: (v, i) => (i === 0 || i === mid || i === last ? v : ""),
          },
        },
      ],
      yAxis: [
        {
          type: "value",
          min: 0,
          max: safeMax,
          interval: safeMax / 5,
          splitLine: { show: true },
          axisLabel: { formatter: (v) => v / 10000 + "만명" },
        },
      ],
      series: [
        {
          name: "혼잡도",
          type: "bar",
          data: seriesData,
          barWidth: "60%",
        },
      ],
      aria: { enabled: true, label: { description: ariaLabel } },
    };
  };

  useEffect(() => {
    if (!info || !hasForecast) {
      setOption(null); // 차트 숨김
      return;
    }
    const raw = info.FCST_PPLTN;
    const xAxisLabels = raw.map((o) => String(o.FCST_TIME).substr(11, 2) + "시");
    setOption(getBarOption(xAxisLabels, raw, `${info.AREA_NM} 인구 혼잡도`));
  }, [info, hasForecast]);

  return (
    <div style={{ width: "100%", margin: "8px 0" }}>
      {/* 상단 요약 */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            borderBottom: "1px solid #eee",
            paddingBottom: 8,
            marginBottom: 12,
          }}
        >
          <h2
            style={{ fontSize: 18, color: "#3f51b5", fontWeight: 800, margin: 0 }}
          >
            {areaName}
          </h2>
          <span style={{ fontSize: 14, color: "#555" }}>
            인구혼잡도가{" "}
            <strong
              id="current-level"
              style={{ fontWeight: 800, color: levelColor(level) }}
            >
              {level}
            </strong>{" "}
            입니다
          </span>
        </div>

        <ul
          style={{
            listStyle: "none",
            fontSize: 13,
            color: "#666",
            margin: 0,
            padding: 0,
            marginBottom: 12,
          }}
        >
          <li style={{ marginBottom: 4 }}>
            현재 실시간 인구:{" "}
            <strong id="current-pop">
              {popMin}~{popMax}
            </strong>
          </li>
          {msgLines.map((line, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {line}
            </li>
          ))}
        </ul>

        <div style={{ fontSize: 14, color: "#3f51b5", marginBottom: 8 }}>
          실시간 인구 추이 및 전망
        </div>

        {/* 차트/빈 상태 */}
        <div style={{ width: "100%", height: 200 }}>
          {hasForecast && option ? (
            <ReactECharts
              option={option}
              style={{ width: "100%", height: "100%" }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <div
              role="status"
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed #e5e7eb",
                borderRadius: 10,
                color: "#666",
                fontSize: 14,
              }}
            >
              데이터 업데이트 예정
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopulationChart;

// import React, { useEffect, useState, useMemo } from 'react';
// import ReactECharts from 'echarts-for-react'; // 래퍼 컴포넌트
// import axios from 'axios';

// const PopulationChart = ({ info }) => {  // 지역 코드로 바꾸기 반포한강공원 = POI095
//   const [option, setOption] = useState({}); // 차트 옵션 상태

//   // ─────────────────────────────────────────
//   // 상단 요약용 유틸
//   const fmtNum = (v) => {
//     const n = Number(v);
//     return Number.isFinite(n) ? n.toLocaleString() : '-';
//   };
//   const levelColor = (lvlRaw) => {
//     const lvl = String(lvlRaw || '').trim();
//     if (lvl === '붐빔') return '#d32f2f';
//     if (lvl === '약간 붐빔') return '#f57c00';
//     if (lvl === '보통') return '#fbc02d';
//     // '원활', '여유' 등
//     return '#388e3c';
//   };
//   const msgLines = useMemo(() => {
//     const raw = String(info?.AREA_CONGEST_MSG || '').trim();
//     if (!raw) return [];
//     // 문장 끝의 마침표를 유지하며 분리
//     return raw
//       .split(/(?<=\.)\s*/g)
//       .map((s) => s.trim())
//       .filter(Boolean);
//   }, [info?.AREA_CONGEST_MSG]);

//   const areaName = info?.AREA_NM || '지역';
//   const level = (info?.AREA_CONGEST_LVL || '—').trim();
//   const popMin = fmtNum(info?.AREA_PPLTN_MIN);
//   const popMax = fmtNum(info?.AREA_PPLTN_MAX);

//   // ─────────────────────────────────────────
//   // getBarOption 
//   const getBarOption = (xAxis, data, ariaLabel) => {
//     const maxnum = data.reduce((m, d) => Math.max(m, +d.FCST_PPLTN_MAX), 0);
//     const mid = Math.floor(xAxis.length / 2);
//     const last = xAxis.length - 1;

//     const seriesData = data.map(d => {
//       let color;
//       switch (d.FCST_CONGEST_LVL?.trim()) {
//         case '붐빔':
//           color = '#d32f2f';
//           break;
//         case '약간 붐빔':
//           color = '#f57c00';
//           break;
//         case '보통':
//           color = '#fbc02d';
//           break;
//         default:
//           color = '#388e3c';
//       }
//       return { value: +d.FCST_PPLTN_MAX, itemStyle: { color } };
//     });

//     return {
//       tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
//       grid: { top: '15%', left: '5%', right: '5%', bottom: '15%', containLabel: true },
//       xAxis: [
//         {
//           type: 'category',
//           data: xAxis,
//           axisTick: { show: false },
//           axisLabel: {
//             interval: 0,
//             showMinLabel: true,
//             showMaxLabel: true,
//             formatter: (v, i) => (i === 0 || i === mid || i === last ? v : ''),
//           },
//         },
//       ],
//       yAxis: [
//         {
//           type: 'value',
//           min: 0,
//           max: maxnum,
//           interval: maxnum / 5,
//           splitLine: { show: true },
//           axisLabel: { formatter: v => v / 10000 + '만명' },
//         },
//       ],
//       series: [
//         {
//           name: '혼잡도',
//           type: 'bar',
//           data: seriesData,
//           barWidth: '60%',
//         },
//       ],
//       aria: { enabled: true, label: { description: ariaLabel } },
//     };
//   };

//   useEffect(() => {
//     if (!info) return;
//     const raw = info.FCST_PPLTN || [];
//     if (!raw.length) return;
//     const xAxisLabels = raw.map(o => String(o.FCST_TIME).substr(11, 2) + '시');
//     const newOption = getBarOption(xAxisLabels, raw, `${info.AREA_NM} 인구 혼잡도`);
//     setOption(newOption); // 상태에 옵션 저장
//   }, [info]);

//   return (
//     <div style={{ width: '100%', margin: '8px 0' }}>
//       {/* ─── 상단 요약 영역 (HTML 스니펫 이식) ─── */}
//       <div style={{
//         background: '#fff',
//         border: '1px solid #e5e7eb',
//         borderRadius: 12,
//         padding: 12,
//         marginBottom: 8
//       }}>
//         <div style={{
//           display: 'flex',
//           alignItems: 'baseline',
//           gap: 12,
//           borderBottom: '1px solid #eee',
//           paddingBottom: 8,
//           marginBottom: 12
//         }}>
//           <h2 style={{ fontSize: 18, color: '#3f51b5', fontWeight: 800, margin: 0 }}>
//             {areaName}
//           </h2>
//           <span style={{ fontSize: 14, color: '#555' }}>
//             인구혼잡도가{' '}
//             <strong
//               id="current-level"
//               style={{ fontWeight: 800, color: levelColor(level) }}
//             >
//               {level}
//             </strong>{' '}
//             입니다
//           </span>
//         </div>

//         <ul style={{ listStyle: 'none', fontSize: 13, color: '#666', margin: 0, padding: 0, marginBottom: 12 }}>
//           <li style={{ marginBottom: 4 }}>
//             현재 실시간 인구:{' '}
//             <strong id="current-pop">
//               {popMin}~{popMax}
//             </strong>
//           </li>
//           {msgLines.length
//             ? msgLines.map((line, i) => (
//                 <li key={i} style={{ marginBottom: 4 }}>{line}</li>
//               ))
//             : null}
//         </ul>

//         <div style={{ fontSize: 14, color: '#3f51b5', marginBottom: 8 }}>
//           실시간 인구 추이 및 전망
//         </div>

//         {/* ─── 그래프 (기존 코드 그대로) ─── */}
//         <div style={{ width: '100%', height: '200px' }}>
//           <ReactECharts
//             option={option}
//             style={{ width: '100%', height: '100%' }}
//             notMerge={true}
//             lazyUpdate={true}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PopulationChart;

