import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import DistrictSidebar from "./DistrictSidebar";
import SidePanel from "./SidePanel";
import CustomMapMarkers from "../../components/Map/CustomMapMarkers";
import "./style.css";
import seoulDistrict from "../../components/Map/SeoulDistrict";
/* global kakao */

// const regionNameMap = {//??
//   "Gangnam-gu": "강남구",
//   "Gangdong-gu": "강동구",
//   "Gangbuk-gu": "강북구",
//   "Gangseo-gu": "강서구",
//   "Gwanak-gu": "관악구",
//   "Gwangjin-gu": "광진구",
//   "Guro-gu": "구로구",
//   "Geumcheon-gu": "금천구",
//   "Nowon-gu": "노원구",
//   "Dobong-gu": "도봉구",
//   "Dongdaemun-gu": "동대문구",
//   "Dongjak-gu": "동작구",
//   "Mapo-gu": "마포구",
//   "Seodaemun-gu": "서대문구",
//   "Seocho-gu": "서초구",
//   "Seongdong-gu": "성동구",
//   "Seongbuk-gu": "성북구",
//   "Songpa-gu": "송파구",
//   "Yangcheon-gu": "양천구",
//   "Yeongdeungpo-gu": "영등포구",
//   "Yongsan-gu": "용산구",
//   "Eunpyeong-gu": "은평구",
//   "Jongno-gu": "종로구",
//   "Jung-gu": "중구",
//   "Jungnang-gu": "중랑구",
// };

// const districtCoords = { //지역구 중심 좌표
//   강남구: { lat: 37.5172, lng: 127.0473 },
//   강동구: { lat: 37.5301, lng: 127.1238 },
//   강북구: { lat: 37.6396, lng: 127.0256 },
//   강서구: { lat: 37.5509, lng: 126.8495 },
//   관악구: { lat: 37.4784, lng: 126.9516 },
//   광진구: { lat: 37.5385, lng: 127.0823 },
//   구로구: { lat: 37.4955, lng: 126.8878 },
//   금천구: { lat: 37.4604, lng: 126.9001 },
//   노원구: { lat: 37.6542, lng: 127.0568 },
//   도봉구: { lat: 37.6691, lng: 127.0324 },
//   동대문구: { lat: 37.5744, lng: 127.0396 },
//   동작구: { lat: 37.5124, lng: 126.9396 },
//   마포구: { lat: 37.5665, lng: 126.9017 },
//   서대문구: { lat: 37.5792, lng: 126.9368 },
//   서초구: { lat: 37.4836, lng: 127.0327 },
//   성동구: { lat: 37.5634, lng: 127.0369 },
//   성북구: { lat: 37.5894, lng: 127.0167 },
//   송파구: { lat: 37.5145, lng: 127.1056 },
//   양천구: { lat: 37.5169, lng: 126.8664 },
//   영등포구: { lat: 37.5264, lng: 126.8963 },
//   용산구: { lat: 37.5323, lng: 126.9909 },
//   은평구: { lat: 37.6176, lng: 126.9227 },
//   종로구: { lat: 37.5731, lng: 126.9793 },
//   중구: { lat: 37.5636, lng: 126.9976 },
//   중랑구: { lat: 37.6063, lng: 127.0927 },
// };

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

    // Raw path 데이터
    const rawPath = districtData.path;
    let rings = [];

    // 배열 구조 판별: 2중 vs 3중
    if (Array.isArray(rawPath[0][0])) {
      // rawPath[0][0]이 배열이면 폴리곤(2중) 혹은 MultiPolygon(3중)
      if (Array.isArray(rawPath[0][0][0])) {
        // 3중 배열 (MultiPolygon) → 1단계 flat
        rings = rawPath.flat();
      } else {
        // 2중 배열 (단일 폴리곤) 그대로
        rings = rawPath;
      }
    } else {
      // 1중 배열 → 단일 링으로 감싸기
      rings = [rawPath];
    }

    // 나머지 구역 채우기
    const outerPath = [
      new kakao.maps.LatLng(-85, -180),
      new kakao.maps.LatLng(85, -180),
      new kakao.maps.LatLng(85, 180),
      new kakao.maps.LatLng(-85, 180),
    ];

    // 각 링을 LatLng 배열로 변환
    const holePaths = rings.map((ring) =>
      ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng))
    );

    // 회색 마스크 (outerPath 안에 holePaths를 뚫음)
    const mask = new kakao.maps.Polygon({
      map: mapObj,
      path: [outerPath, ...holePaths],
      strokeWeight: 0,
      fillColor: "#000000",
      fillOpacity: 0.5,
    });

    // 흰색 외곽선 (각 링마다)
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

    // cleanup: 이전 폴리곤 제거
    return () => {
      mask.setMap(null);
      borders.forEach((b) => b.setMap(null));
    };
  }, [mapObj, districtData]);

  const closePanel = () => setActivePanel(null);

  return (
    <div className="container">
      <DistrictSidebar
        regionName={districtData?.text}
        setActivePanel={setActivePanel}
      />
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
