// src/pages/CourseForm.jsx
import React, { useState, useMemo, useEffect } from "react";
import Header from "../../components/Header";
import StepBasic from "./CourseDate";
import CourseLocation from "./CourseLocation";
import "./style.css";

export default function CourseForm({
  mode = "create",            // "create" | "edit"
  initialData,
  onSubmit,
  onCancel,
  submitting = false,         // 부모가 내려주는 전송중 상태
}) {
  const normalize = (src) => ({
    title: src?.title ?? "",
    // datepicker에서 Date를 쓰면 그대로, 없으면 ""
    datetime: src?.datetime ?? "",
    // ★ 선택된 장소만 진짜 소스 (없으면 빈 배열)
    selectedPlaces: Array.isArray(src?.selectedPlaces) ? src.selectedPlaces : [],
    // (선택) 참고용으로 보여줄 전체 후보 리스트가 필요하면 유지
    places: Array.isArray(src?.places) ? src.places : [],
  });

  // initialData로 상태 초기화
  const [data, setData] = useState(() => normalize(initialData));
  const [step, setStep] = useState(1);

  // initialData가 나중에 들어와도 반영
  useEffect(() => {
    setData(normalize(initialData));
  }, [initialData]);

  // 단계별 유효성: 1단계(제목+날짜), 2단계(선택된 장소 1개 이상)
  const canNext = useMemo(() => {
    if (step === 1) return data.title.trim().length > 0 && !!data.datetime;
    if (step === 2) return (data.selectedPlaces?.length ?? 0) > 0; // ★ 핵심
    return false;
  }, [step, data]);

  const handleNext = () => {
    if (step === 1 && canNext) setStep(2);
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
  };

  const handleFinish = () => {
    if (!canNext || submitting) return;  // 전송중/검증 실패 시 무시
    // ★ 항상 selectedPlaces를 서버로 보낼 places에 매핑해서 전달
    onSubmit?.({ ...data, places: data.selectedPlaces });
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

              {step < 2 ? (
                <button
                  className="btn primary"
                  onClick={handleNext}
                  disabled={!canNext}
                  type="button"
                >
                  다음
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={handleFinish}
                  disabled={!canNext || submitting}   // 전송중 비활성화
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