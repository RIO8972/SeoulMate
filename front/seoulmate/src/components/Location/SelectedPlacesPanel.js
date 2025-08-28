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

  const getId = (item, idx) =>
    String(item.placeId ?? item.id ?? `${item.lat}-${item.lng}-${idx}`);

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
                const id = getId(item, idx);
                return (
                  <Draggable draggableId={id} index={idx} key={id}>
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
                          {/* ⤵ 드래그 핸들: 숫자 점에만 붙여서 끌기 */}
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
                              onRemove(item.placeId ?? item.id ?? id);
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
