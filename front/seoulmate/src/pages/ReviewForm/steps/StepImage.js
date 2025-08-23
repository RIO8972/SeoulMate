// src/pages/ReviewForm/steps/StepImage.jsx
import React, { useRef, useMemo, useEffect } from "react";
import styles from "./StepImage.module.css";
import "../../ReviewForm/style.css";

function StepImage({ data, setData }) {
  const inputRef = useRef(null);
  const images = Array.isArray(data?.images) ? data.images : [];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const merged = [...images, ...selectedFiles];

    if (merged.length > 10) {
      alert("이미지는 최대 10장까지 업로드할 수 있습니다.");
      return;
    }

    // 함수형 업데이트(동시 업데이트 안전)
    setData((prev) => ({ ...prev, images: merged }));
    // 같은 파일 다시 선택 가능하도록 리셋
    e.target.value = "";
  };

  const handleRemove = (index) => {
    setData((prev) => ({
      ...prev,
      images: images.filter((_, i) => i !== index),
    }));
  };

  // 문자열은 그대로, File/Blob은 객체 URL 생성
  const previews = useMemo(() => {
    return images.map((item) => {
      if (typeof item === "string") {
        return { src: item, revoke: null };
      }
      if (item instanceof File || item instanceof Blob) {
        const url = URL.createObjectURL(item);
        return { src: url, revoke: () => URL.revokeObjectURL(url) };
      }
      return { src: "", revoke: null };
    });
  }, [images]);

  // 메모리 정리
  useEffect(() => {
    return () => {
      previews.forEach((p) => p.revoke && p.revoke());
    };
  }, [previews]);

  return (
    <div className="review-container">
      <h2 className="review-title">이미지 업로드</h2>
      <p className="review-subtitle">리뷰에서 보여줄 이미지를 업로드해주세요</p>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        ref={inputRef}
        style={{ display: "none" }}
      />
      <button
        type="button"
        className={styles.uploadBtn}
        onClick={() => inputRef.current?.click()}
      >
        이미지 선택
      </button>

      <div className={styles.imagePreviewGrid}>
        {previews.map((p, idx) =>
          p.src ? (
            <div key={idx} className={styles.imagePreviewBox}>
              <img
                src={p.src}
                alt={`preview-${idx}`}
                className={styles.imagePreview}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleRemove(idx)}
              >
                ✕
              </button>
            </div>
          ) : null
        )}
      </div>

      <p className={styles.imageCount}>
        {images.length}/10 이미지 (최소 1장 / 최대 10장)
      </p>
    </div>
  );
}

export default StepImage;
