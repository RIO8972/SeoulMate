// src/pages/CourseForm.jsx
import React, { useState, useMemo, useEffect } from "react";
import Header from "../../components/Header";
import StepBasic from "./CourseDate";
import CourseLocation from "./CourseLocation";
import CourseCategory from "./CourseCategory";
import "./style.css";

export default function CourseForm({
  mode = "create",
  initialData,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const normalize = (src) => ({
    title: src?.title ?? "",
    datetime: src?.datetime ?? "",
    categories: Array.isArray(src?.categories) ? src.categories : [],
    keyword: Array.isArray(src?.categories) ? src.categories.join(" · ") : "",
    selectedPlaces: Array.isArray(src?.selectedPlaces) ? src.selectedPlaces : [],
    places: Array.isArray(src?.places) ? src.places : [],
  });

  const [data, setData] = useState(() => normalize(initialData));
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(1);

  useEffect(() => {
    setData(normalize(initialData));
  }, [initialData]);

  // ✅ 단계별 유효성: 1) 카테고리 → 2) 기본정보 → 3) 장소선택
  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return (data.categories?.length ?? 0) > 0; // 카테고리 최소 1개
      case 2:
        return data.title.trim().length > 0 && !!data.datetime; // 제목+날짜
      case 3:
        return (data.selectedPlaces?.length ?? 0) > 0; // 장소 최소 1개
      default:
        return false;
    }
  }, [step, data]);

  const handleNext = () => {
    if (!canNext || submitting) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    if (!canNext || submitting) return;
    onSubmit?.({
      title: data.title,
      datetime: data.datetime,
      categories: data.categories || [],
      places: data.selectedPlaces || [],
    });
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="course-form-wrapper">
      <Header />
      <div className="course-form">
        {/* 1단계: 카테고리 */}
        {step === 1 && (
          <div className="form-card">
            <CourseCategory data={data} setData={setData} />
          </div>
        )}

        {/* 2단계: 기본정보(제목/날짜) */}
        {step === 2 && (
          <div className="form-card">
            <StepBasic data={data} setData={setData} />
          </div>
        )}

        {/* 3단계: 장소선택 */}
        {step === 3 && (
          <div className="location-step-container">
            <CourseLocation data={data} setData={setData} />
          </div>
        )}

        <div className="wizard-footer">
          <div className="wizard-progress">
            <div className="wizard-progress__fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="wizard-actions" style={{ justifyContent: "space-between" }}>
            {onCancel ? (
              <button className="btn ghost" onClick={onCancel} type="button">
                취소
              </button>
            ) : (
              <span />
            )}

            <div>
              {step > 1 && (
                <button
                  className="btn ghost"
                  onClick={handlePrev}
                  style={{ marginRight: 8 }}
                  type="button"
                >
                  이전
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button
                  className="btn primary"
                  onClick={handleNext}
                  disabled={!canNext || submitting}
                  type="button"
                >
                  다음
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={handleFinish}
                  disabled={!canNext || submitting}
                  type="button"
                >
                  {submitting ? "저장 중…" : mode === "edit" ? "수정 완료" : "완료"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
