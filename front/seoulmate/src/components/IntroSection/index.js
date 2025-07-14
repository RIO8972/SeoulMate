import "./style.css";
import seoulMap from "../../images/seoul-map.png";

const IntroSection = () => {
  return (
    <div className="intro-container">
      <img src={seoulMap} alt="서울 지도" className="map-image" />
      <div className="intro-text">
        <h2>
          실시간 인기 데이터를 바탕으로 <br /> 여유로운 데이트를 계획하세요!
        </h2>
        <p>
          서울의 원하는 지역을 선택하여 해당 지역의 <br /> 데이트 장소를 고르고
          저장할 수 있어요!
        </p>
      </div>
    </div>
  );
};

export default IntroSection;
