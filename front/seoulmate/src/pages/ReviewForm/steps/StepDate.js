import Select from "react-select";
import "../../ReviewForm/style.css";
import styles from "./StepDate.module.css";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function StepDate({ data, setData }) {
  const handleChange = (field) => (value) => {
    setData((prev) => ({ ...prev, [field]: value.value }));
  };

  const locationOptions = [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ].map((gu) => ({ value: gu, label: gu }));

  return (
    <div className="review-container">
      <h2 className="review-title">데이트 코스 리뷰</h2>
      <p className="review-subtitle">데이트에 대한 기본 정보를 입력해주세요</p>

      <div className={styles["step-container"]}>
        <div className={styles["step-container-group"]}>
          <label className={styles["step-label"]}>
            방문일자를 선택해주세요
          </label>
          <DatePicker
            selected={data.datetime}
            onChange={(date) => setData({ ...data, datetime: date })}
            showTimeInput
            dateFormat="yyyy-MM-dd HH:mm"
            shouldCloseOnSelect={false}
            placeholderText="날짜와 시간을 선택하세요"
            className={`${styles["step-select-box"]} ${
              data.datetime ? styles["has-value"] : ""
            }`}
            timeInputLabel="시간:"
          />
        </div>

        <div className={styles["step-container-group"]}>
          <label className={styles["step-label"]}>
            데이트 지역을 선택해주세요
          </label>
          <Select
            classNamePrefix="custom-select"
            options={locationOptions}
            value={locationOptions.find((opt) => opt.value === data.region)}
            onChange={handleChange("region")}
            placeholder="지역 선택"
            menuPlacement="auto"
            maxMenuHeight={160}
          />
        </div>
      </div>
    </div>
  );
}

export default StepDate;
