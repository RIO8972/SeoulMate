// src/pages/ReviewForm/steps/StepDate.jsx
import Select from "react-select";
import "../../ReviewForm/style.css";
import styles from "./StepDate.module.css";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/** "YYYY-MM-DDTHH:mm:ss" 같은 문자열에서 {date, time} 추출 */
const splitDateTime = (dt) => {
  if (!dt) return { date: "", time: "" };
  const s = String(dt);
  // 2025-08-12T09:30:00.000+09:00 또는 2025-08-12 09:30:00
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})/);
  if (m) return { date: m[1], time: `${m[2]}:${m[3]}` };
  return { date: "", time: "" };
};

/** data.date + data.time 또는 data.datetime을 기반으로 Date 객체 생성 */
const toDateObj = (dateStr, timeStr, datetimeStr) => {
  let date = dateStr;
  let time = timeStr;

  if ((!date || !time) && datetimeStr) {
    const parsed = splitDateTime(datetimeStr);
    date = date || parsed.date;
    time = time || parsed.time;
  }

  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const pad2 = (n) => String(n).padStart(2, "0");

function StepDate({ data, setData }) {
  // DatePicker가 표시할 값 (date/time 없을 때 datetime에서 보충)
  const selectedDate = toDateObj(data?.date, data?.time, data?.datetime);

  const handleDateChange = (dt) => {
    if (!dt) {
      setData((prev) => ({ ...prev, date: "", time: "", datetime: null }));
      return;
    }
    const y = dt.getFullYear();
    const m = pad2(dt.getMonth() + 1);
    const d = pad2(dt.getDate());
    const hh = pad2(dt.getHours());
    const mm = pad2(dt.getMinutes());

    const date = `${y}-${m}-${d}`;
    const time = `${hh}:${mm}`;
    const datetime = `${date}T${time}:00`;

    setData((prev) => ({ ...prev, date, time, datetime }));
  };

  const handleRegionChange = (value) => {
    setData((prev) => ({ ...prev, region: value?.value || "" }));
  };

  const locationOptions = [
    "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
    "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
    "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구",
  ].map((gu) => ({ value: gu, label: gu }));

  return (
    <div className="review-container">
      <h2 className="review-title">데이트 코스 리뷰</h2>
      <p className="review-subtitle">데이트에 대한 기본 정보를 입력해주세요</p>

      <div className={styles["step-container"]}>
        <div className={styles["step-container-group"]}>
          <label className={styles["step-label"]}>방문일자를 선택해주세요</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            showTimeInput
            dateFormat="yyyy-MM-dd HH:mm"
            shouldCloseOnSelect={false}
            placeholderText="날짜와 시간을 선택하세요"
            className={`${styles["step-select-box"]} ${selectedDate ? styles["has-value"] : ""}`}
            timeInputLabel="시간:"
          />
        </div>

        <div className={styles["step-container-group"]}>
          <label className={styles["step-label"]}>데이트 지역을 선택해주세요</label>
          <Select
            classNamePrefix="custom-select"
            options={locationOptions}
            value={locationOptions.find((opt) => opt.value === (data?.region || "")) || null}
            onChange={handleRegionChange}
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