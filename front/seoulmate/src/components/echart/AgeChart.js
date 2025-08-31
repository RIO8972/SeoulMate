import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import styles from './AgeChart.module.css';

const AgeChart = ({ info }) => {
  const [option, setOption] = useState({});

  // 유틸: 소수점 깔끔하게
  const fmtPct = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const s = n.toFixed(1);
    return s.endsWith('.0') ? String(Math.round(n)) : s;
  };

  // 차트 옵션 생성
  const getAgeOption = (data, ariaLabel, colors) => {
    const values = [
      parseFloat(data.PPLTN_RATE_10),
      parseFloat(data.PPLTN_RATE_20),
      parseFloat(data.PPLTN_RATE_30),
      parseFloat(data.PPLTN_RATE_40),
      parseFloat(data.PPLTN_RATE_50),
      parseFloat(data.PPLTN_RATE_60),
    ];
    const visibleSum = values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          const val = fmtPct(p.value);
          const pct = Number.isFinite(p.percent) ? `${Math.round(p.percent)}%` : '';
          return `${p.name}: ${val ?? '-'}% ${pct ? `(${pct})` : ''}`;
        },
      },
      color: colors,
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 50,
        left: 8,
        right: 8,
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 12,
        textStyle: { fontSize: 14 },
        data: ['10대', '20대', '30대', '40대', '50대', '60대+'],
        pageButtonPosition: 'end',
        pageIconColor: '#9ca3af',
        pageIconInactiveColor: '#e5e7eb',
        pageTextStyle: { color: '#6b7280' },
      },
      series: [
        {
          name: '연령별 인구 비율',
          type: 'pie',
          center: ['50%', '50%'],
          radius: ['34%', '96%'],
          startAngle: 180,
          avoidLabelOverlap: false,
          label: {
            position: 'inner',
            formatter: '{c}%',
            fontSize: 10,
          },
          labelLine: { show: false },
          data: [
            { name: '10대', value: values[0] },
            { name: '20대', value: values[1] },
            { name: '30대', value: values[2] },
            { name: '40대', value: values[3] },
            { name: '50대', value: values[4] },
            { name: '60대+', value: values[5] },
            {
              name: '',
              value: visibleSum,               // 반원 뒤쪽 투명 채우기
              itemStyle: { color: 'transparent' },
              label: { show: false },
              tooltip: { show: false },
            },
          ],
        },
      ],
      aria: { enabled: true, label: { description: ariaLabel } },
    };
  };

  // 상위 연령대 코멘트 계산
  const insightText = useMemo(() => {
    if (!info) return null;

    const pairs = [
      { label: '10대', value: parseFloat(info.PPLTN_RATE_10) },
      { label: '20대', value: parseFloat(info.PPLTN_RATE_20) },
      { label: '30대', value: parseFloat(info.PPLTN_RATE_30) },
      { label: '40대', value: parseFloat(info.PPLTN_RATE_40) },
      { label: '50대', value: parseFloat(info.PPLTN_RATE_50) },
      { label: '60대+', value: parseFloat(info.PPLTN_RATE_60) },
    ].filter((p) => Number.isFinite(p.value));

    if (pairs.length === 0) return '연령대 비율 데이터가 부족합니다.';

    const sorted = pairs.sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const second = sorted[1];

    const topStr = `${top.label} 비중이 가장 높아요 (${fmtPct(top.value)}%).`;
    const secondStr = second ? ` 다음으로 ${second.label}(${fmtPct(second.value)}%)가 많습니다.` : '';
    return topStr + secondStr;
  }, [info]);

  useEffect(() => {
    if (!info) return;

    const ariaLabel =
      `${info.AREA_NM} 연령별 인구 (${info.AREA_PPLTN_MIN}~${info.AREA_PPLTN_MAX}명): ` +
      `10대 ${info.PPLTN_RATE_10}%, 20대 ${info.PPLTN_RATE_20}%, ` +
      `30대 ${info.PPLTN_RATE_30}%, 40대 ${info.PPLTN_RATE_40}%, ` +
      `50대 ${info.PPLTN_RATE_50}%, 60대 이상 ${info.PPLTN_RATE_60}%`;

    const newOption = getAgeOption(
      info,
      ariaLabel,
      ['#F2F2F3', '#C3E1F3', '#A1C9E8', '#89ADD3', '#6C97BF', '#4C75A3']
    );
    setOption(newOption);
  }, [info]);

  if (!info) return null;

  return (
    <div className={styles.container} aria-label="연령별 인구 분포">
      <div className={styles.header}>
        <h3 className={styles.title}>연령별 분포</h3>
      </div>

      <div className={styles.chart}>
        <ReactECharts
          option={option}
          style={{ width: '100%', height: '100%' }}
          notMerge
          lazyUpdate
        />
      </div>

      <div className={styles.insight}>
        <strong>한 줄 요약 · </strong>
        {insightText}
      </div>
    </div>
  );
};

export default AgeChart;
