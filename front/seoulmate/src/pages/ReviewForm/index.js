import { useState } from "react";
import "./style.css";
import Header from "../../components/Header";
import StepCategory from "./steps/StepCategory";
import StepDate from "./steps/StepDate";
import StepLocation from "./steps/StepLocation";
import StepImage from "./steps/StepImage";
import StepDescription from "./steps/StepDescription";
import StepCost from "./steps/StepCost";

function ReviewForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    categories: [],
    date: "",
    time: "",
    region: "",
    places: [],
    images: [],
    title: "",
    intro: "",
    detail: "",
    cost: 0,
  });

  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => prev - 1);

  return (
    <div className="review-form-wrapper">
      <Header />

      <div className="review-form">
        {step === 1 && <StepCategory data={formData} setData={setFormData} />}
        {step === 2 && <StepDate data={formData} setData={setFormData} />}
        {step === 3 && <StepLocation data={formData} setData={setFormData} />}
        {step === 4 && <StepImage data={formData} setData={setFormData} />}
        {step === 5 && (
          <StepDescription data={formData} setData={setFormData} />
        )}
        {step === 6 && <StepCost data={formData} setData={setFormData} />}
      </div>

      {/* 진행 상태 바 및 하단 버튼 */}
      <div className="review-footer">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
        <div
          className="review-button-group"
          style={{ justifyContent: step === 1 ? "flex-end" : "space-between" }}
        >
          {step > 1 && (
            <button className="review-button back" onClick={prev}>
              이전
            </button>
          )}
          {step < 6 && (
            <button className="review-button next" onClick={next}>
              다음
            </button>
          )}
          {step === 6 && (
            <button
              className="review-button next"
              onClick={() => alert("등록되었습니다.")}
            >
              완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewForm;
