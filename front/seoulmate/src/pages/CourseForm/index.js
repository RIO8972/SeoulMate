import React, { useState, useMemo, useEffect } from "react";
import Header from "../../components/Header";
import StepBasic from "./CourseDate";
import CourseLocation from "./CourseLocation";
import "./style.css";

export default function CourseForm({
  mode = "create", // "create" | "edit"
  initialData, // ✅ 편집 시 넘어오는 초기값
  onSubmit,
  onCancel,
}) {
  const normalize = (src) => ({
    title: src?.title ?? "",
    // datetime-local 인풋은 문자열을 원하므로 빈 문자열로 통일
    datetime: src?.datetime ?? "",
    selectedPlaces: src?.selectedPlaces ?? [],
    places: src?.places ?? [],
  });

  // ✅ initialData로 상태 초기화
  const [data, setData] = useState(() => normalize(initialData));
  const [step, setStep] = useState(1);

  // ✅ initialData가 나중에 들어와도 반영
  useEffect(() => {
    setData(normalize(initialData));
  }, [initialData]);

  const canNext = useMemo(() => {
    if (step === 1) return data.title.trim().length > 0 && !!data.datetime;
    if (step === 2) return (data.places?.length ?? 0) > 0;
    return false;
  }, [step, data]);

  const handleNext = () => {
    if (step === 1 && canNext) setStep(2);
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
  };

  const handleFinish = () => {
    onSubmit?.(data);
    if (mode === "create") {
      alert("코스가 저장되었습니다!");
    } else {
      alert("코스가 수정되었습니다!");
    }
  };

  const progress = (step / 2) * 100;

  return (
    <div className="course-form-wrapper">
      <Header />
      <div className="course-form">
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
            style={{ justifyContent: "space-between" }}
          >
            {/* 취소 버튼(옵션) */}
            {onCancel ? (
              <button className="btn ghost" onClick={onCancel}>
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
                >
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
      </div>
    </div>
  );
}
