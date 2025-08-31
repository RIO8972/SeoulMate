import "./style.css";
import styles from "./CourseDate.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function CourseDate({ data, setData }) {
  return (
    <div className="course-container">
      <h2 className="course-title">데이트 코스 만들기</h2>
      <p className="course-subtitle">
        데이트 코스에 대한 기본 정보를 입력해주세요
      </p>

      <div className={styles["course-form-container"]}>
        <div className={styles["course-form-group"]}>
          <label className={styles["course-label"]}>
            코스 제목을 입력해주세요
          </label>
          <input
            type="text"
            value={data.title || ""}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="예) 강남 데이트 코스"
            className={styles["course-input"]}
          />
        </div>

        <div className={styles["course-form-group"]}>
          <label className={styles["course-label"]}>
            데이트 날짜를 선택해주세요
          </label>
          <DatePicker
            selected={data.datetime}
            onChange={(date) => setData({ ...data, datetime: date })}
            showTimeInput
            dateFormat="yyyy-MM-dd HH:mm"
            shouldCloseOnSelect={false}
            placeholderText="날짜와 시간을 선택하세요"
            className={styles["course-input"]}
            timeInputLabel="시간:"
          />
        </div>
      </div>
    </div>
  );
}

export default CourseDate;
