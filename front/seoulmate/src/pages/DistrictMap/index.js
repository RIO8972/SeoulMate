import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import SidePanel from "./SidePanel";
import CustomMapMarkers from "../../components/Map/CustomMapMarkers";
import "./style.css";
import seoulDistrict from "../../components/Map/SeoulDistrict";
/* global kakao */

function DistrictMap() {
  const { regionId } = useParams();

  // seoulDistrict 배열에서 id로 해당 구 정보 가져오기
  const districtData = seoulDistrict.find((item) => item.id === regionId);

  const mapRef = useRef(null);
  const [mapObj, setMapObj] = useState(null);
  const [district, setDistrict] = useState(null);
  const [activePanel, setActivePanel] = useState(null);

  // API로 구별 인구/교통 등 데이터 fetch
  useEffect(() => {
    if (!districtData) return;
    axios
      .get(
        `https://seoul-mate.co.kr/cityapi/cache/regions/population/districts/${regionId}`
      )
      .then((res) => setDistrict(res.data))
      .catch(console.error);
  }, [regionId, districtData]);

  // 지도 초기화 & 중심 마커
  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current || !districtData) return;
    const { lat, lng, text } = districtData;

    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(lat, lng),
      level: 5,
    });
    setMapObj(map);

    new kakao.maps.Marker({
      map,
      position: new kakao.maps.LatLng(lat, lng),
      title: text, // 한글 구 이름
    });
  }, [districtData]);

  // 폴리곤 마스크 + 외곽선 그리기 (2중/3중 배열 모두 지원)
  useEffect(() => {
    if (!mapObj || !districtData?.path) return;

    const rawPath = districtData.path;
    let rings = [];

    // 배열 구조 판별: 2중 vs 3중
    if (Array.isArray(rawPath[0][0])) {
      if (Array.isArray(rawPath[0][0][0])) {
        rings = rawPath.flat(); // 3중 배열
      } else {
        rings = rawPath; // 2중 배열
      }
    } else {
      rings = [rawPath]; // 1중 배열
    }

    const outerPath = [
      new kakao.maps.LatLng(-85, -180),
      new kakao.maps.LatLng(85, -180),
      new kakao.maps.LatLng(85, 180),
      new kakao.maps.LatLng(-85, 180),
    ];

    const holePaths = rings.map((ring) =>
      ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng))
    );

    const mask = new kakao.maps.Polygon({
      map: mapObj,
      path: [outerPath, ...holePaths],
      strokeWeight: 0,
      fillColor: "#000000",
      fillOpacity: 0.5,
    });

    const borders = holePaths.map(
      (pathCoords) =>
        new kakao.maps.Polyline({
          map: mapObj,
          path: pathCoords,
          strokeWeight: 4,
          strokeColor: "#ffffff",
          strokeOpacity: 0.5,
          strokeStyle: "solid",
        })
    );

    return () => {
      mask.setMap(null);
      borders.forEach((b) => b.setMap(null));
    };
  }, [mapObj, districtData]);

  const closePanel = () => setActivePanel(null);

  return (
    <div className="container">
      <Sidebar mode="map" setActivePanel={setActivePanel} />
      <div className="mapWrapper">
        <div ref={mapRef} className="mapContainer" />
        {mapObj && district && (
          <CustomMapMarkers map={mapObj} district={district} />
        )}
        {activePanel && (
          <SidePanel title={getTitle(activePanel)} onClose={closePanel} />
        )}
      </div>
    </div>
  );
}

function getTitle(key) {
  switch (key) {
    case "search":
      return "검색";
    case "traffic":
      return "교통";
    case "weather":
      return "날씨";
    case "saved":
      return "저장";
    default:
      return "";
  }
}

export default DistrictMap;
