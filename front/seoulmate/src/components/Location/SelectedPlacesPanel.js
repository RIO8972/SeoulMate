import React from "react";
import styles from "./SelectedPlacesPanel.module.css";

function SelectedPlacesPanel({ selectedPlaces, onRemoveAll, onRemove }) {
  if (selectedPlaces.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>📍 선택된 장소</h4>
        <button className={styles.removeAll} onClick={onRemoveAll}>
          전체 삭제
        </button>
      </div>
      <ul className={styles.list}>
        {selectedPlaces.map((place, index) => (
          <li key={place.id} className={styles.item}>
            <div className={styles.card}>
              <span className={styles.badge}>{index + 1}</span>
              <div className={styles.info}>
                <div className={styles.name}>{place.name}</div>
                <div className={styles.time}>이동 시간: 00분</div>
              </div>
              <button
                className={styles.remove}
                onClick={() => onRemove(place.placeId)} // 여기!!!!!!!!! place.id. -> place.placeId로 변경, (id로 하면 테이벌 컬럼값이랑 이름충돌나서)
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SelectedPlacesPanel;
