import React, { useState, useMemo } from "react";
import StepBasic from "./CourseDate";
import CourseLocation from "./CourseLocation";
import "./style.css";

export default function CourseForm({ onSubmit }) {
  const [step, setStep] = useState(1);

  const [data, setData] = useState({
    title: "",
    datetime: null,
    selectedPlaces: [], // 선택 중인 장소들
    places: [], // 최종 확정된 장소들 (완료 조건용)
  });

  const canNext = useMemo(() => {
    if (step === 1) return data.title.trim().length > 0 && data.datetime;
    if (step === 2) return data.places.length > 0;
    return false;
  }, [step, data]);

  const handleNext = () => {
    if (step === 1) setStep(2);
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
  };

  const handleFinish = () => {
    onSubmit?.(data);
    alert("코스가 저장되었습니다!");
  };

  const progress = (step / 2) * 100;

  return (
    <div className="course-form-page">
      {step === 1 && (
        <div className="form-card">
          <StepBasic data={data} setData={setData} />
        </div>
      )}

      {step === 2 && (
        <div className="location-step-container">
          <CourseLocation data={data} setData={setData} />
        </div>
      )}

      <div className="wizard-footer">
        <div className="wizard-progress">
          <div
            className="wizard-progress__fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className="wizard-actions"
          style={{ justifyContent: step === 1 ? "flex-end" : "space-between" }}
        >
          {step > 1 && (
            <button className="btn ghost" onClick={handlePrev}>
              이전
            </button>
          )}

          {step < 2 ? (
            <button
              className="btn primary"
              onClick={handleNext}
              disabled={!canNext}
            >
              다음
            </button>
          ) : (
            <button
              className="btn primary"
              onClick={handleFinish}
              disabled={!canNext}
            >
              완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
