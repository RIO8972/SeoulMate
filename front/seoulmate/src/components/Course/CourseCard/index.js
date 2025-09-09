import React, { useMemo } from "react";
import styles from "../CourseCard.module.css";

/** 카테고리 → 이모지 */
const CATEGORY_MAP = {
  맛집: "🌟",
  음식점: "🍽️",
  카페: "☕",
  디저트: "🍰",
  자연: "🌲",
  산책: "🚶🏻‍♂️",
  야경: "🌃",
  감성: "✨",
  명소: "📍",
  힐링: "🍵",
  쇼핑: "🛍️",
  실내: "🛋️",
  전시: "🖼️",
  팝업: "🏬",
  공연: "🎫",
  영화관: "🎞️",
  액티비티: "🛼",
  드라이브: "🚗",
};

/** 문자열/객체 배열 모두 → 라벨 배열로 */
const toChips = (raw) =>
  (Array.isArray(raw) ? raw : [])
    .map((c) => (typeof c === "string" ? c : c?.label || c?.name || ""))
    .map((s) => String(s).trim())
    .filter(Boolean);

/** 메인 컬러 #455de5 계열: 채도/명도 단계 톤 (밝은→진한) */
const TONES = ["#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8"];

/** 간단 해시로 코스별 톤 고정 */
function pickTone(course) {
  const key = String(course?.id ?? course?.title ?? "");
  if (!key) return TONES[0];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export default function CourseCard({ course, onClick }) {
  const chips = toChips(course?.categories);
  const shown = chips.slice(0, 3);
  const more = chips.length - shown.length;

  // ⭐ 카드 배경을 코스별로 고정 선택
  const tone = useMemo(() => pickTone(course), [course?.id, course?.title]);

  // CSS 변수 전달 (JSX에서 커스텀 CSS 변수 사용 시 key를 문자열로)
  const styleVar = { ["--card-base"]: tone };

  return (
    <button
      type="button"
      className={styles.card}
      style={styleVar}
      onClick={onClick}
    >
      {/* 상단 날짜 */}
      <div className={styles.date}>{course?.date} 데이트 예정</div>

      {/* 제목 */}
      <h3 className={styles.title}>{course?.title}</h3>

      {/* 절취선 */}
      <div className={styles.cutline} />

      {/* 하단: 지역 + 카테고리 칩 */}
      <div className={styles.bottom}>
        <div className={styles.region}>{course?.region || "지역 미정"}</div>

        {shown.length > 0 && (
          <div className={styles.chips}>
            {shown.map((t) => (
              <span key={t} className={styles.chip}>
                <span className={styles.emoji}>{CATEGORY_MAP[t] || "🏷️"}</span>
                {t}
              </span>
            ))}
            {more > 0 && <span className={styles.chipMore}>+{more}</span>}
          </div>
        )}
      </div>
    </button>
  );
}
