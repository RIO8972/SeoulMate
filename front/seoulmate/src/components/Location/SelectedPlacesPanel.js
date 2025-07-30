import React from "react";
import SelectedPlaces from "./SelectedPlaces";
import styles from "./SelectedPlacesPanel.module.css";

function SelectedPlacesPanel({ selectedPlaces, onRemoveAll, onRemove }) {
  if (selectedPlaces.length === 0) return null;

  return (
    <div className={styles.panelContainer}>
      <div className={styles.panelHeader}>
        <h4 className={styles.panelTitle}>📍선택된 장소</h4>
        <button onClick={onRemoveAll} className={styles.removeAllButton}>
          전체 삭제
        </button>
      </div>

      <ul className={styles.placeList}>
        {selectedPlaces.map((place) => (
          <li key={place.id} className={styles.placeItem}>
            <span className={styles.placeName}>{place.name}</span>
            <button
              onClick={() => onRemove(place.id)}
              className={styles.removeButton}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SelectedPlacesPanel;
