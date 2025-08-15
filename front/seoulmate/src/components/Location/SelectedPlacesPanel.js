import React from "react";
import styles from "./SelectedPlacesPanel.module.css";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";

function SortableItem({ place, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.placeId });

  return (
    <li
      ref={setNodeRef}
      className={styles.item}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : "auto",
      }}
    >
      <div className={styles.card}>
        {/* 드래그 핸들: 맨 앞(숫자 배지 앞) */}
        <button
          className={styles.dragHandle}
          title="드래그해서 순서 변경"
          aria-label="순서 변경"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>

        {/* 번호 배지 */}
        <span className={styles.badge}>{index + 1}</span>

        {/* 본문 */}
        <div className={styles.info}>
          <div className={styles.name}>{place.name}</div>
        </div>

        {/* X 버튼: 오른쪽 상단 고정 */}
        <button
          className={styles.remove}
          onClick={() => onRemove(place.placeId)}
          aria-label="삭제"
          title="삭제"
        >
          ×
        </button>
      </div>
    </li>
  );
}

function SelectedPlacesPanel({
  selectedPlaces = [],
  onRemoveAll,
  onRemove,
  onReorder,
}) {
  // 훅은 항상 최상단
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = selectedPlaces.map((p) => p.placeId);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    onReorder?.(arrayMove(selectedPlaces, oldIndex, newIndex));
  };

  if (selectedPlaces.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>📍 선택된 장소</h4>
        <button className={styles.removeAll} onClick={onRemoveAll}>
          전체 삭제
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className={styles.list}>
            {selectedPlaces.map((place, index) => (
              <SortableItem
                key={place.placeId}
                place={place}
                index={index}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default SelectedPlacesPanel;
