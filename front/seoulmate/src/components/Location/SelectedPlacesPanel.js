import React from "react";
import styles from "./SelectedPlacesPanel.module.css";

export default function SelectedPlacesPanel({
  selectedPlaces,
  onRemove,
  onRemoveAll,
  onReorder, // dnd 사용 시 그대로 연결
}) {
  return (
    <div>
      <div className={styles.header}>
        <span className={styles.title}>선택된 장소</span>
        <button
          type="button"
          className={styles.clearAllBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveAll();
          }}
        >
          전체 삭제
        </button>
      </div>

      <ul className={styles.list}>
        {selectedPlaces.map((item, idx) => {
          const key =
            item.placeId ?? item.id ?? `${item.lat}-${item.lng}-${idx}`;
          return (
            <li key={key}>
              <div className={styles.card}>
                <span className={styles.orderDot}>{idx + 1}</span>
                <div className={styles.placeName}>{item.name}</div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(item.placeId ?? item.id);
                  }}
                  aria-label={`${item.name} 삭제`}
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
