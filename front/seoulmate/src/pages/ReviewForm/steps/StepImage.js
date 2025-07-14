import React, { useRef } from "react";
import styles from "./StepImage.module.css";
import "../../ReviewForm/style.css";

function StepImage({ data, setData, next, prev }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalFiles = [...(data.images || []), ...selectedFiles];

    if (totalFiles.length > 10) {
      alert("이미지는 최대 10장까지 업로드할 수 있습니다.");
      return;
    }

    setData({ ...data, images: totalFiles });
  };

  const handleRemove = (index) => {
    const newImages = data.images.filter((_, i) => i !== index);
    setData({ ...data, images: newImages });
  };

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
        onClick={() => inputRef.current.click()}
      >
        이미지 선택
      </button>

      <div className={styles.imagePreviewGrid}>
        {(data.images || []).map((file, idx) => (
          <div key={idx} className={styles.imagePreviewBox}>
            <img
              src={URL.createObjectURL(file)}
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
        ))}
      </div>

      <p className={styles.imageCount}>
        {data.images?.length || 0}/10 이미지 (최소 1장 / 최대 10장)
      </p>
    </div>
  );
}

export default StepImage;
