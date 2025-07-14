import "./style.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../../components/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

const getCardColor = (level) => {
  switch (level) {
    case "붐빔":
      return "#f44336";
    case "약간 붐빔":
      return "#ff9800";
    case "보통":
      return "#FFD63A";
    case "여유":
      return "#4caf50";
    default:
      return "#9e9e9e";
  }
};

const DistrictPage = () => {
  //파라미터로 리전코드 받기
  const { regionId } = useParams();
  const [district, setDistrict] = useState({
    regionName: "",
    regionCode: "",
    places: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(
        "https://seoul-mate.co.kr/cityapi/cache/regions/population/districts/" +
          regionId,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log("region_data", res.data);
        setDistrict(res.data);
      })
      .catch(console.error);
  }, []);
  return (
    <>
      <Header />
      <div className="district-wrapper">
        <h1 className="region-title">
          <FontAwesomeIcon
            icon={faLocationDot}
            style={{ marginRight: "8px" }}
          />
          {district.regionName} 실시간 혼잡도
        </h1>
        <div className="card-grid">
          {district.places.map((place, index) => {
            const level = place.AREA_CONGEST_LVL?.trim(); //혼잡도
            const name = place.AREA_NM; //장소명
            const areaCode = place.AREA_CD;

            if (!level || !name) return null;

            const color = getCardColor(level); //혼잡도 색

            return (
              <div
                key={`${name}-${index}`}
                className="place-card"
                onClick={() => navigate(`/map/${encodeURIComponent(areaCode)}`)}
              >
                <div className="card-image">
                  <img
                    src={`/images/${areaCode}.jpg`}
                    alt={name}
                    onError={(e) => (e.target.src = "/images/default1.jpg")}
                  />
                </div>
                <div className="card-content">
                  <div className="card-title">{name}</div>
                  <span
                    className="congestion-badge"
                    style={{
                      backgroundColor: color,
                      color: "#fff",
                    }}
                  >
                    {level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default DistrictPage;
