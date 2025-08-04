import { useState } from "react";
import "./style.css";
import Header from "../../components/Header";
import StepCategory from "./steps/StepCategory";
import StepDate from "./steps/StepDate";
import StepLocation from "./steps/StepLocation";
import StepImage from "./steps/StepImage";
import StepDescription from "./steps/StepDescription";
import StepCost from "./steps/StepCost";
import axios from "axios";

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

  /************************ 리뷰 백서버로 전송 ******************************/
  const handleSave = () => {
    const form = new FormData();

    // 1) dto JSON Blob
    form.append(
      "dto",
      new Blob(
        [
          JSON.stringify({
            categories: formData.categories,
            cost: formData.cost,
            date: formData.date,
            datetime: formData.datetime,
            detail: formData.detail,
            intro: formData.intro,
            region: formData.region,
            time: formData.time,
            title: formData.title,
            places: formData.places, // [{placeId, name, lat, …}, …]
          }),
        ],
        { type: "application/json" }
      )
    );

    // 2) images
    formData.images.forEach((file) => form.append("images", file));

    const token = localStorage.getItem("accessToken"); // 키 이름 맞게
    console.log("토큰:", token);
    //
    axios
      .post("http://localhost:8080/reviews/test/img", form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          // 절대 'Content-Type' 지정하지 말 것!
        },
      })
      .then((res) => {
        console.log("업로드 성공:", res.data);
        alert("form데이터 전송이 완료되었습니다!");
      })
      .catch((err) => {
        console.error("업로드 실패:", err);
        alert("업로드 중 오류가 발생했습니다.");
      });
  };
  /******************************************************************/

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
              onClick={() => {
                console.log(formData);
                handleSave();
              }}
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
