import "../../ReviewForm/style.css";
import styles from "./StepDescription.module.css";

function StepDescription({ data, setData, next, prev }) {
  return (
    <div className="review-container">
      <h2 className="review-title">리뷰 작성</h2>
      <p className="review-subtitle">코스 소개 및 상세 정보를 작성해주세요</p>

      <input
        type="text"
        placeholder="데이트 이름"
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        className={styles["input-box"]}
      />

      <textarea
        placeholder="코스 소개 (100자 이상)"
        value={data.intro}
        onChange={(e) => setData({ ...data, intro: e.target.value })}
        className={styles["textarea-box"]}
      />

      <textarea
        placeholder="상세 정보 (예: 예약 팁, 데려가기 좋은 날씨 등)"
        value={data.detail}
        onChange={(e) => setData({ ...data, detail: e.target.value })}
        className={styles["textarea-box"]}
      />
    </div>
  );
}

export default StepDescription;
