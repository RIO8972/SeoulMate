// src/components/Location/SelectedPlacesPanel.jsx
import React from "react";
import styles from "./SelectedPlacesPanel.module.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function SelectedPlacesPanel({
  selectedPlaces,
  onRemove,
  onRemoveAll,
  onReorder, // (newList) => void
}) {
  const handleDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.index === source.index) return;

    const next = Array.from(selectedPlaces);
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);

    onReorder?.(next);
  };

  // uid를 최우선으로 사용 (없으면 placeId/id/좌표-인덱스)
  const getKey = (item, idx) =>
    String(item.uid ?? item.placeId ?? item.id ?? `${item.lat}-${item.lng}-${idx}`);

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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="selected-places">
          {(dropProvided) => (
            <ul
              className={styles.list}
              ref={dropProvided.innerRef}
              {...dropProvided.droppableProps}
            >
              {selectedPlaces.map((item, idx) => {
                const key = getKey(item, idx); // ← uid 우선
                return (
                  <Draggable draggableId={key} index={idx} key={key}>
                    {(dragProvided, dragSnapshot) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <div
                          className={`${styles.card} ${
                            dragSnapshot.isDragging ? styles.dragging : ""
                          }`}
                        >
                          {/* 드래그 핸들 */}
                          <span
                            className={`${styles.orderDot} ${styles.handle}`}
                            {...dragProvided.dragHandleProps}
                          >
                            {idx + 1}
                          </span>

                          <div className={styles.placeName}>{item.name}</div>

                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // 삭제도 uid를 최우선으로 넘김
                              onRemove(item.uid ?? item.placeId ?? item.id ?? key);
                            }}
                            aria-label={`${item.name} 삭제`}
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                );
              })}
              {dropProvided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
