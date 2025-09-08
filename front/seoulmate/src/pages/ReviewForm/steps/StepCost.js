import "../../ReviewForm/style.css";
import styles from "./StepCost.module.css";

function StepCost({ data, setData }) {
  const MAX_PRICE = 500000;

  // cost를 항상 숫자(0~MAX)로 안전하게 보정
  const safeCost = (() => {
    const n = Number(data?.cost ?? 0);
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > MAX_PRICE) return MAX_PRICE;
    return n;
  })();

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    // 함수형 업데이트로 dirty 체크/동시 업데이트 안전
    setData((prev) => ({ ...prev, cost: value }));
  };

  const percent = Math.round((safeCost / MAX_PRICE) * 100);

  return (
    <div className="review-container">
      <h2 className="review-title">사용한 비용 입력</h2>
      <p className="review-subtitle">
        전체 데이트 코스에서 실제로 지출한 총액을 입력해 주세요
      </p>

      {/* 실시간 금액 표시 */}
      <div className={styles.priceDisplay}>
        <span className={styles.currentPrice}>
          ₩{safeCost.toLocaleString()}
        </span>
      </div>

      {/* 슬라이더 */}
      <input
        type="range"
        min={0}
        max={MAX_PRICE}
        step={1000}
        value={safeCost}
        onChange={handleSliderChange}
        className={styles.slider}
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${percent}%, #ddd ${percent}%, #ddd 100%)`,
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
