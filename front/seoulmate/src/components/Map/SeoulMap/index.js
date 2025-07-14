import "./style.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import seoulDistrict from "../SeoulDistrict";
import { motion } from "framer-motion";

const SeoulMap = () => {
  const [colorMap, setColorMap] = useState({});
  const navigate = useNavigate();
  const handleRegionClick = (regionId) => {
    navigate(`/districts/${regionId}`);
  };

  useEffect(() => {
    axios
      .get("https://seoul-mate.co.kr/cityapi/cache/regions/population/colors") //get요청
      .then((res) => {
        console.log("색 데이터:", res.data);
        setColorMap(res.data);
      })
      .catch((err) => {
        console.error("컬러 맵 로드 실패:", err);
      });
  }, []);

  return (
    <div className="map-layout">
      <div className="legend-box">
        <h2 className="legend-title">서울 실시간 혼잡도</h2>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#4C75A3" }}
          ></span>{" "}
          붐빔
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#6C97BF" }}
          ></span>{" "}
          약간 붐빔
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#89ADD3" }}
          ></span>{" "}
          보통
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "#C3E1F3" }}
          ></span>{" "}
          여유
        </div>
      </div>

      {/* 지도 SVG */}
      <div className="map-wrapper">
        <svg
          className="map-svg"
          version="1.1"
          id="Layer_1"
          x="0px"
          y="0px"
          viewBox="0 0 1400 1400"
          enableBackground="new 0 0 1400 1400"
        >
          {seoulDistrict.map((region) => (
            <g
              key={region.id} //추가?
              id={region.id}
              className="map-region"
              onClick={() => handleRegionClick(region.id)}
            >
              <motion.path
                id={region.id}
                d={region.d}
                fill={colorMap[region.id]?.color || "#C3E1F3"}
                fillRule="evenodd"
                clipRule="evenodd"
                stroke="#fff"
                strokeWidth="1.5"
                initial={{ fillOpacity: 0 }}
                animate={{ fillOpacity: 1 }}
                transition={{ duration: 1.5 }}
              />
              <text className="map-text" x={region.textX} y={region.textY}>
                {region.text}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default SeoulMap;
