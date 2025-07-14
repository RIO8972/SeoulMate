import "../../ReviewForm/style.css";
import styles from "./StepCost.module.css";

function StepCost({ data, setData, prev }) {
  const MAX_PRICE = 500000; // 최대 금액
  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setData({ ...data, cost: value });
  };

  return (
    <div className="review-container">
      <h2 className="review-title">예상 비용 입력</h2>
      <p className="review-subtitle">
        전체 데이트 코스의 예상 총 비용을 입력해주세요
      </p>

      {/* 실시간 금액 표시 */}
      <div className={styles.priceDisplay}>
        <span className={styles.currentPrice}>
          ₩{Number(data.cost).toLocaleString()}
        </span>
      </div>

      {/* 슬라이더 */}
      <input
        type="range"
        min="0"
        max={MAX_PRICE}
        step="1000"
        value={data.cost}
        onChange={handleSliderChange}
        className={styles.slider}
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${
            (data.cost / MAX_PRICE) * 100
          }%, #ddd ${(data.cost / MAX_PRICE) * 100}%, #ddd 100%)`,
        }}
      />

      <div className={styles.sliderLabels}>
        <span>₩0</span>
        <span>₩{MAX_PRICE.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default StepCost;
