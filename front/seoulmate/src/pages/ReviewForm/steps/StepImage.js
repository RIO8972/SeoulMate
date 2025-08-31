// src/pages/ReviewForm/steps/StepImage.jsx
import React, { useRef, useMemo, useEffect } from "react";
import styles from "./StepImage.module.css";
import "../../ReviewForm/style.css";

const MAX_IMAGES = 10;

function StepImage({ data, setData, mode = "create" }) {
  const inputRef = useRef(null);

  const existingImages = Array.isArray(data?.existingImages)
    ? data.existingImages // [{id, url}]
    : [];

  const deleteImgs = Array.isArray(data?.deleteImgs) ? data.deleteImgs : []; // number[]
  const newImages = Array.isArray(data?.newImages) ? data.newImages : [];     // File[]

  // ----- 기존 이미지 삭제 토글 (로그 포함, 단 한 번만 선언) -----
  const toggleDelete = (imgId) => {
    if (imgId == null) return; // id 없으면 무시
    setData((prev) => {
      const set = new Set(prev.deleteImgs || []);
      const willUnmark = set.has(imgId);
      if (willUnmark) set.delete(imgId);
      else set.add(imgId);

      const next = { ...prev, deleteImgs: Array.from(set) };
      console.log("[StepImage] toggleDelete", {
        imgId,
        action: willUnmark ? "UNMARK_DELETE" : "MARK_DELETE",
        before: prev.deleteImgs || [],
        after: next.deleteImgs,
      });
      return next;
    });
  };

  const onExistingDeleteClick = (image) => (e) => {
    e.stopPropagation();
    console.log("[StepImage] X clicked on existing image:", image);
    toggleDelete(image.id);
  };
  // -------------------------------------------------------------

  // 실제로 남게 될 기존 이미지 수(삭제 체크 제외)
  const keptExistingCount = existingImages.filter(
    (img) => !deleteImgs.includes(img.id)
  ).length;

  // 미리보기 소스 만들기
  const newPreviews = useMemo(
    () => newImages.map((f) => URL.createObjectURL(f)),
    [newImages]
  );
  useEffect(() => {
    return () => newPreviews.forEach((u) => URL.revokeObjectURL(u));
  }, [newPreviews]);

  const openPicker = () => inputRef.current?.click();

  const onFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentTotal = keptExistingCount + newImages.length;
    const room = Math.max(0, MAX_IMAGES - currentTotal);
    const accepted = files.slice(0, room);

    if (accepted.length === 0) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 가능합니다.`);
      e.target.value = "";
      return;
    }

    setData((prev) => ({
      ...prev,
      newImages: [...(prev.newImages || []), ...accepted],
    }));
    e.target.value = "";
  };

  const removeNew = (idx) => {
    setData((prev) => ({
      ...prev,
      newImages: (prev.newImages || []).filter((_, i) => i !== idx),
    }));
  };

  const totalCount = keptExistingCount + newImages.length;

  return (
    <div className="review-container">
      <h2 className="review-title">이미지 업로드</h2>
      <p className="review-subtitle">
        리뷰에서 보여줄 이미지를 업로드해주세요 (최대 {MAX_IMAGES}장)
      </p>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
        ref={inputRef}
        style={{ display: "none" }}
      />
      <button type="button" className={styles.uploadBtn} onClick={openPicker}>
        이미지 선택
      </button>

      {/* 기존 이미지 영역 */}
      {existingImages.length > 0 && (
        <>
          {/* <h4 className={styles.sectionTitle}>기존 이미지</h4> */}
          <div className={styles.imagePreviewGrid}>
            {existingImages.map((img) => {
              const isDeleted = deleteImgs.includes(img.id);
              return (
                <div
                  key={img.id ?? img.url}
                  className={`${styles.imagePreviewBox} ${
                    isDeleted ? styles.dimmed : ""
                  }`}
                  title={img.id == null ? "id 없음 (서버 삭제 불가)" : ""}
                >
                  <img src={img.url} alt="" className={styles.imagePreview} />
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={onExistingDeleteClick(img)}
                    disabled={img.id == null}
                  >
                    {isDeleted ? "↺" : "✕"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 새로 추가한 이미지 영역 */}
      {newImages.length > 0 && (
        <>
          <h4 className={styles.sectionTitle}>이미지 추가</h4>
          <div className={styles.imagePreviewGrid}>
            {newPreviews.map((src, idx) => (
              <div key={idx} className={styles.imagePreviewBox}>
                <img src={src} alt="" className={styles.imagePreview} />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeNew(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <p className={styles.imageCount}>
        {totalCount}/{MAX_IMAGES} 이미지
      </p>
    </div>
  );
}

export default StepImage;