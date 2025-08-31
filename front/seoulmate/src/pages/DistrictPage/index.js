// src/pages/DistrictPage/index.jsx
import "./style.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../../components/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMap,
  faListUl,
} from "@fortawesome/free-solid-svg-icons";

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

export default function DistrictPage() {
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
        `https://seoul-mate.co.kr/cityapi/cache/regions/population/districts/${regionId}`,
        { headers: { "Content-Type": "application/json" } }
      )
      .then((res) => setDistrict(res.data))
      .catch(console.error);
  }, [regionId]);

  return (
    <div className="district-page">
      <Header />

      <div className="district-wrapper">
        {/* 🔹 제목 바로 위 토글 */}
        <div className="list-view-toggle" role="group" aria-label="보기 전환">
          <button
            type="button"
            className="vt-btn"
            onClick={() => navigate(`/map/${encodeURIComponent(regionId)}`)}
            aria-pressed="false"
          >
            <FontAwesomeIcon icon={faMap} className="vt-ico" />
            지도로 보기
          </button>
          <button type="button" className="vt-btn active" aria-pressed="true">
            <FontAwesomeIcon icon={faListUl} className="vt-ico" />
            리스트로 보기
          </button>
        </div>

        <h1 className="region-title">
          <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 8 }} />
          {district.regionName} 실시간 혼잡도
        </h1>

        <div className="card-grid">
          {district.places.map((place, idx) => {
            const level = place.AREA_CONGEST_LVL?.trim();
            const name = place.AREA_NM;
            const areaCode = place.AREA_CD;
            if (!level || !name) return null;

            return (
              <div
                key={`${name}-${idx}`}
                className="place-card"
                onClick={() =>
                  navigate(
                    `/map/${encodeURIComponent(
                      regionId
                    )}?place=${encodeURIComponent(
                      areaCode
                    )}&name=${encodeURIComponent(name)}`
                  )
                }
              >
                <div className="card-image">
                  <img
                    src={`/images/${areaCode}.jpg`}
                    alt={name}
                    onError={(e) =>
                      (e.currentTarget.src = "/images/default1.jpg")
                    }
                  />
                </div>
                <div className="card-content">
                  <div className="card-title">{name}</div>
                  <span
                    className="congestion-badge"
                    style={{
                      backgroundColor: getCardColor(level),
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
    </div>
  );
}
