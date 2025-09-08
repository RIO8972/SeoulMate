import React, { useMemo, useCallback } from "react";
import styles from "./CategoryPicker.module.css";

/**
 * CategoryPicker
 * - emoji / 이미지(.png .jpg .svg ...) 모두 지원
 * - 다중 선택 + 최대 개수 제한
 * - 열 개수/간격/버튼 크기 옵션
 */
export default function CategoryPicker({
  items = [], // [{label, icon}]
  selected = [], // ['맛집', '카페', ...]
  onChange, // (nextSelected: string[]) => void
  max = 3, // 최대 선택 개수
  columns = 3, // 한 줄 열 개수
  colGap = 12, // 가로 간격(px)
  rowGap = 12, // 세로 간격(px)
  buttonMinH = 96, // 버튼 최소 높이(px)
  emojiSize = 30, // 이모지 크기(px)
  className = "", // 바깥 그리드 래퍼 추가 클래스
}) {
  const isImage = useCallback(
    (v) => typeof v === "string" && /\.(png|jpe?g|gif|svg)$/i.test(v),
    []
  );

  const handleToggle = useCallback(
    (label) => {
      if (!onChange) return;
      const set = new Set(selected);
      if (set.has(label)) {
        set.delete(label);
        onChange(Array.from(set));
        return;
      }
      if (selected.length >= max) {
        alert(`카테고리는 최대 ${max}개까지 선택할 수 있어요.`);
        return;
      }
      set.add(label);
      onChange(Array.from(set));
    },
    [onChange, selected, max]
  );

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      columnGap: `${colGap}px`,
      rowGap: `${rowGap}px`,
    }),
    [columns, colGap, rowGap]
  );

  return (
    <div
      className={`${styles.grid} ${className}`}
      style={gridStyle}
      role="list"
    >
      {items.map(({ label, icon }) => {
        const active = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            role="listitem"
            className={`${styles.button} ${active ? styles.selected : ""}`}
            onClick={() => handleToggle(label)}
            aria-pressed={active}
            aria-label={`${label} ${active ? "선택됨" : "선택"}`}
            style={{ minHeight: buttonMinH }}
          >
            {isImage(icon) ? (
              <img
                src={`/icons/${icon}`}
                alt={label}
                className={styles.icon}
                loading="lazy"
                width={36}
                height={36}
              />
            ) : (
              <span
                className={styles.emoji}
                role="img"
                aria-label={label}
                style={{ fontSize: emojiSize }}
              >
                {icon}
              </span>
            )}
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
