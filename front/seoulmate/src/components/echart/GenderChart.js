import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import styles from "./GenderChart.module.css";

const PRESETS = {
  normal:  { height: 280, radius: ["36%", "82%"], labelFont: 12 },
  compact: { height: 220, radius: ["42%", "74%"], labelFont: 11 },
  mini:    { height: 180, radius: ["46%", "70%"], labelFont: 10 },
};

const GenderChart = ({ info, size = "compact" }) => {
  const [option, setOption] = useState({});
  const preset = PRESETS[size] ?? PRESETS.compact;

  const colors = useMemo(() => ["#5c6bc0", "#EC7B76"], []);

  const getPieOption = (m, f, ariaLabel) => {
    const mNum = Number(m);
    const fNum = Number(f);
    const male   = Number.isFinite(mNum) ? mNum : 0;
    const female = Number.isFinite(fNum) ? fNum : 0;

    const total = male + female;
    const dummy = total < 100 ? 100 - total : 0;

    const data = [
      { name: "남성", value: male },
      { name: "여성", value: female },
    ];
    if (dummy > 0) {
      data.push({
        name: "",
        value: dummy,
        itemStyle: { color: "transparent" },
        label: { show: false },
        tooltip: { show: false },
      });
    }

    return {
      color: colors,
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      series: [
        {
          name: "성별 분포",
          type: "pie",
          radius: ["30%", "80%"],          //프리셋 반지름 적용
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "inside",
            formatter: "{d}%",
            fontSize: preset.labelFont,   // 프리셋 라벨 폰트
            color: "#fff",
          },
          labelLine: { show: false },
          data,
        },
      ],
      aria: { enabled: true, label: { description: ariaLabel } },
    };
  };

  // 인사이트 문장 (남/여 중 누가 더 높은지)
  const insight = useMemo(() => {
    if (!info) return null;
    const m = Number(info.MALE_PPLTN_RATE);
    const f = Number(info.FEMALE_PPLTN_RATE);
    const pct = (v) =>
      Number.isFinite(v) ? (Math.round(v * 10) / 10).toString().replace(/\.0$/, "") : "-";

    if (!Number.isFinite(m) && !Number.isFinite(f)) {
      return "성별 비율 데이터가 부족합니다.";
    }
    if (Number.isFinite(m) && Number.isFinite(f)) {
      if (m > f) {
        return (
          <>
            <span className={styles.male}>남성</span> 비중이 더 높아요
            {" "}( {pct(m)}% vs {pct(f)}% ).
          </>
        );
      }
      if (f > m) {
        return (
          <>
            <span className={styles.female}>여성</span> 비중이 더 높아요
            {" "}( {pct(f)}% vs {pct(m)}% ).
          </>
        );
      }
      return <>남녀 비중이 거의 동일해요 (각 {pct(m)}%).</>;
    }
    if (Number.isFinite(m)) {
      return <>남성 {pct(m)}% 데이터만 제공됩니다.</>;
    }
    return <>여성 {pct(f)}% 데이터만 제공됩니다.</>;
  }, [info]);

  useEffect(() => {
    if (!info) return;
    const maleRate   = parseFloat(info.MALE_PPLTN_RATE);
    const femaleRate = parseFloat(info.FEMALE_PPLTN_RATE);
    setOption(getPieOption(maleRate, femaleRate, `${info.AREA_NM} 성별 분포`));
  }, [info]);

  if (!info) return null;

  return (
    <div className={styles.container} data-size={size} aria-label="성별 분포">
      <div className={styles.header}>
        <h3 className={styles.title}>성별 분포</h3>
      </div>

      <div className={styles.chart} style={{ height: preset.height }}>
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          notMerge
          lazyUpdate
        />
      </div>

      {/* ✅ 한 줄 요약 */}
      <div className={styles.insight}>
        <strong>한 줄 요약 · </strong>
        {insight}
      </div>
    </div>
  );
};

export default GenderChart;
