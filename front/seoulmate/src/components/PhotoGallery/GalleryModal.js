import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./GalleryModal.module.css";

export default function GalleryModal({
  images = [],
  initialIndex = 0,
  onClose,
}) {
  const list = useMemo(
    () => images.filter(Boolean).slice(0, 10), // 안전하게 최대 10장
    [images]
  );
  const [index, setIndex] = useState(
    Number.isFinite(initialIndex) ? initialIndex : 0
  );

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + list.length) % list.length),
    [list.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % list.length),
    [list.length]
  );

  // ESC/좌우키, 스크롤 잠금
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, prev, next]);

  if (!list.length) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <div className={styles.counter}>
            {index + 1} / {list.length}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 메인 큰 이미지 & 좌우 네비 */}
        <div className={styles.viewer}>
          <button className={styles.navBtn} onClick={prev} aria-label="이전">
            ‹
          </button>
          <img
            className={styles.mainImg}
            src={list[index]}
            alt={`image-${index + 1}`}
            loading="eager"
          />
          <button className={styles.navBtn} onClick={next} aria-label="다음">
            ›
          </button>
        </div>

        {/* 썸네일 그리드 (전체 10장 다 보여줌) */}
        <div className={styles.grid}>
          {list.map((src, i) => (
            <button
              key={src + i}
              className={`${styles.thumbWrap} ${
                i === index ? styles.active : ""
              }`}
              onClick={() => setIndex(i)}
              aria-label={`사진 ${i + 1} 보기`}
            >
              <img
                className={styles.thumb}
                src={src}
                alt={`thumb-${i + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
