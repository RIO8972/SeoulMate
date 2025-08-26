import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import SidePanel from "./SidePanel";
import CustomMapMarkers from "../../components/Map/CustomMapMarkers";

import AgeChart from "../../components/echart/AgeChart";
import PopulationChart from "../../components/echart/PopulationChart";
import GenderChart from "../../components/echart/GenderChart";

import Weather from "../../components/WEATHER/Weather";
import Traffic from "../../components/Traffic/Traffic";

import "./style.css";
import seoulDistrict from "../../components/Map/SeoulDistrict";
import PlaceMapSelector from "../../components/Location/PlaceMapSelector";
import TransportSummary from "../../components/Transport/TransportSummary";

/* global kakao */

// 도로 색상 매핑
const roadColor = { 원활: "#09CD5E", 서행: "#FFA808", 정체: "#D81D36" };

// ────────────────────────────────
// 공용 팝업 유틸
// ────────────────────────────────
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** 공용 팝업 DOM 생성 (타이틀 + 라벨/값 행 리스트) */
function buildPopupBox(title, rows = []) {
  const box = document.createElement("div");
  box.className = "mapPopup";
  box.innerHTML = `
    <button class="mapPopup__close" aria-label="닫기">×</button>
    <strong class="mapPopup__title">${esc(title || "")}</strong>
    <div class="mapPopup__content">
      ${rows
        .map(
          (r) => `
        <div class="mapPopup__row">
          <span class="mapPopup__label">${esc(r.label || "")}</span>
          <span class="mapPopup__value">${
            r?.valueHtml != null ? r.valueHtml : esc(r?.value || "")
          }</span>
        </div>`
        )
        .join("")}
    </div>
  `;
  return box;
}

/** 공용 오버레이 열기 (기존 오버레이 닫고 새로 열기) */
function openOverlay(map, overlayRef, position, box) {
  if (overlayRef.current) {
    overlayRef.current.setMap(null);
    overlayRef.current = null;
  }
  const overlay = new kakao.maps.CustomOverlay({
    content: box,
    position,
    xAnchor: 0.5,
    yAnchor: 1,
    zIndex: 3,
  });
  overlay.setMap(map);
  overlayRef.current = overlay;

  const closeBtn = box.querySelector(".mapPopup__close");
  if (closeBtn) {
    closeBtn.onclick = () => {
      overlay.setMap(null);
      if (overlayRef.current === overlay) overlayRef.current = null;
    };
  }
}

function DistrictMap() {
  const { regionId } = useParams();

  // refs & states
  const mapRef = useRef(null);
  const [mapObj, setMapObj] = useState(null);
  const [district, setDistrict] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeData, setPlaceData] = useState(null);
  const [searchData, setSearchData] = useState({ places: [] });

  //태그 기반 "미리보기 핀"
  const [previewPlaces, setPreviewPlaces] = useState([]);
  const previewMarkersRef = useRef([]);

  // 현재 그려진 도로/주차 마커/팝업 보관
  const roadLinesRef = useRef([]);       // Polyline들
  const parkingMarkersRef = useRef([]);  // 주차장 마커들
  const overlayRef = useRef(null);       // 공용 팝업(CustomOverlay)

  // 현재 구(자치구) 메타
  const districtData = seoulDistrict.find((i) => i.id === regionId);

  // 검색 키워드(구 이름 등)를 고정
  const regionKeyword = districtData?.keyWord;

  // 패널이 바뀔 때마다 미리보기 핀/오버레이/상태 초기화
  useEffect(() => {
  // 지도에 찍힌 미리보기 마커 제거
  previewMarkersRef.current.forEach((m) => m.setMap(null));
  previewMarkersRef.current = [];

  // 오버레이(팝업)도 정리
  if (overlayRef.current) {
    overlayRef.current.setMap(null);
    overlayRef.current = null;
  }

  // 상태도 초기화 → 다시 search로 돌아와도 빈 상태에서 시작
  setPreviewPlaces([]);
}, [activePanel]);

  // 1) 구별 인구 데이터
  useEffect(() => {
    if (!districtData) return;
    axios
      .get(`https://seoul-mate.co.kr/cityapi/cache/regions/population/districts/${regionId}`)
      .then((res) => setDistrict(res.data))
      .catch(console.error);
  }, [regionId, districtData]);

  // 2) 지도 초기화
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
      title: text,
    });
  }, [districtData]);

  // 3) 구 경계 마스크 + 외곽선
  useEffect(() => {
    if (!mapObj || !districtData?.path) return;

    const toRings = (rawPath) => {
      if (!rawPath) return [];
      if (Array.isArray(rawPath[0][0])) {
        if (Array.isArray(rawPath[0][0][0])) return rawPath.flat();
        return rawPath;
      }
      return [rawPath];
    };

    const rings = toRings(districtData.path);

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

  // 4) 마커 클릭 → placeData 로드만 (도로/마커는 여기서 그리지 않음)
  const handlePlaceClick = useCallback((place) => {
    setSelectedPlace(place);
    setActivePanel("place");
    axios
      .get(`https://seoul-mate.co.kr/cityapi/cache/regions/city/districts/${place.AREA_CD}`)
      .then((res) => setPlaceData(res.data))
      .catch(console.error);
  }, []);

  // 5) 패널 열기/닫기
  const openPanel = useCallback((type) => setActivePanel(type), []);
  const closePanel = () => {
    setActivePanel(null);
    setSelectedPlace(null);
    setPlaceData(null);

    // 패널 닫으면 도로/주차/팝업 정리
    roadLinesRef.current.forEach((l) => l.setMap(null));
    roadLinesRef.current = [];
    parkingMarkersRef.current.forEach((m) => m.setMap(null));
    parkingMarkersRef.current = [];
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    //미리보기 마커 정리
    previewMarkersRef.current.forEach((m) => m.setMap(null));
    previewMarkersRef.current = [];
  };

  // 6-A) "place" 화면일 때만 도로 폴리라인 + 팝업(오버레이)
  useEffect(() => {
    // 이전 도로/팝업 정리
    roadLinesRef.current.forEach((l) => l.setMap(null));
    roadLinesRef.current = [];
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (!mapObj) return;
    if (activePanel !== "place") return;
    const roads = placeData?.ROAD_TRAFFIC_STTS?.ROAD_TRAFFIC_STTS;
    if (!roads?.length) return;

    const newLines = [];
    roads.forEach((item) => {
      const path = item.XYLIST.split("|").map((pair) => {
        const [lng, lat] = pair.split("_").map(Number);
        return new kakao.maps.LatLng(lat, lng);
      });
      const color = roadColor[item.IDX] || "#3b82f6";

      const colorLine = new kakao.maps.Polyline({
        map: mapObj,
        path,
        strokeWeight: 3,
        strokeColor: color,
        strokeOpacity: 1,
        strokeStyle: "solid",
        lineJoin: "round",
        lineCap: "round",
        zIndex: 1,
      });

      const hitLine = new kakao.maps.Polyline({
        map: mapObj,
        path,
        strokeWeight: 12,
        strokeColor: color,
        strokeOpacity: 0.2,
        strokeStyle: "solid",
        lineJoin: "round",
        lineCap: "round",
        zIndex: 2,
        clickable: true,
      });

      // 커서 변경
      kakao.maps.event.addListener(hitLine, "mouseover", () => {
        if (mapRef.current) mapRef.current.style.cursor = "pointer";
      });
      kakao.maps.event.addListener(hitLine, "mouseout", () => {
        if (mapRef.current) mapRef.current.style.cursor = "";
      });

      // 클릭 시 공용 팝업
      kakao.maps.event.addListener(hitLine, "click", (e) => {
        const box = buildPopupBox(item.ROAD_NM ?? "도로", [
          {
            label: "속도",
            valueHtml: `<span style="color:${color}; font-weight:700;">${item.SPD} km/h</span>`,
          },
          { label: "구간거리", value: `${item.DIST} m` },
        ]);
        openOverlay(mapObj, overlayRef, e.latLng, box);
      });

      newLines.push(colorLine, hitLine);
    });

    roadLinesRef.current = newLines;

    return () => {
      newLines.forEach((l) => l.setMap(null));
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [mapObj, activePanel, placeData]);

  // 6-B) "traffic" 화면일 때 주차장 마커
  useEffect(() => {
    // 이전 주차장 마커 정리
    parkingMarkersRef.current.forEach((m) => m.setMap(null));
    parkingMarkersRef.current = [];

    if (!mapObj) return;
    if (activePanel !== "traffic") return;

    const parks = placeData?.PRK_STTS;
    if (!Array.isArray(parks) || parks.length === 0) return;

    // 중복 제거
    const byCode = new Map();
    parks.forEach((p) => {
      const key = p.PRK_CD || `${p.LAT},${p.LNG}`;
      if (!byCode.has(key)) byCode.set(key, p);
    });

    const markers = [];

    byCode.forEach((p) => {
      const lat = Number(p.LAT);
      const lng = Number(p.LNG);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const pos = new kakao.maps.LatLng(lat, lng);

      const marker = new kakao.maps.Marker({
        map: mapObj,
        position: pos,
        title: p.PRK_NM,
      });

      const cpcty = p.CPCTY == null || p.CPCTY === "" ? "-" : p.CPCTY;
      const paid = p.PAY_YN === "Y" ? "유료" : "무료";
      const addr = p.ROAD_ADDR || p.ADDRESS || "-";
      const live = p.CUR_PRK_YN === "Y" ? (p.CUR_PRK_TIME || "-") : null;

      kakao.maps.event.addListener(marker, "click", () => {
        const rows = [
          { label: "수용면수", value: String(cpcty) },
          { label: "요금", value: paid },
          { label: "주소", value: addr },
        ];
        if (live) rows.push({ label: "실시간", value: live });

        const box = buildPopupBox(p.PRK_NM || "주차장", rows);
        openOverlay(mapObj, overlayRef, pos, box);
      });

      markers.push(marker);
    });

    parkingMarkersRef.current = markers;

    return () => {
      markers.forEach((m) => m.setMap(null));
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [mapObj, activePanel, placeData]);

  //6-C) "search" 화면에서 태그로 받은 previewPlaces를 지도에 마커로 표시
  useEffect(() => {
    // 이전 미리보기 마커 정리
    previewMarkersRef.current.forEach((m) => m.setMap(null));
    previewMarkersRef.current = [];

    if (!mapObj) return;
    if (activePanel !== "search") return;
    if (!Array.isArray(previewPlaces) || !previewPlaces.length) return;

    const bounds = new kakao.maps.LatLngBounds();
    const markers = [];

    previewPlaces.forEach((p) => {
      const lat = parseFloat(p.y ?? p.lat);
      const lng = parseFloat(p.x ?? p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const pos = new kakao.maps.LatLng(lat, lng);
      bounds.extend(pos);

      const marker = new kakao.maps.Marker({
        map: mapObj,
        position: pos,
        title: p.place_name || p.name || "",
        zIndex: 1,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        const rows = [
          { label: "주소", value: p.road_address_name || p.address_name || "" },
          p.url
            ? {
                label: "링크",
                valueHtml: `<a href="${esc(p.url)}" target="_blank" rel="noreferrer">바로가기</a>`,
              }
            : null,
        ].filter(Boolean);
        const box = buildPopupBox(p.place_name || p.name || "장소", rows);
        openOverlay(mapObj, overlayRef, pos, box);
      });

      markers.push(marker);
    });

    if (markers.length) {
      previewMarkersRef.current = markers;
      if (!bounds.isEmpty()) mapObj.setBounds(bounds);
    }
  }, [mapObj, activePanel, previewPlaces]);

  // 7) 패널 콘텐츠
  const renderPanelContent = () => {
    const needsPlace = ["place", "traffic", "weather"].includes(activePanel || "");

    if (needsPlace && !placeData) {
      return selectedPlace ? <p>로딩 중…</p> : <p>먼저 지도에서 장소를 선택하세요.</p>;
    }

    switch (activePanel) {
      case "place": {
        const info = placeData?.LIVE_PPLTN_STTS?.[0];
        if (!info) return <p>로딩 중…</p>;
        return (
          <>
            <h3>지금 {selectedPlace?.AREA_NM}은(는)</h3>
            <TransportSummary data={placeData} />
            <PopulationChart info={info} />
            <GenderChart info={info} />
            <AgeChart info={info} />
          </>
        );
      }
      case "traffic":
        return (
          <>
            <h2>{placeData?.LIVE_PPLTN_STTS?.[0]?.AREA_CD || "정보 없음"}</h2>
            <Traffic
              parkingData={placeData?.PRK_STTS}
              sbikeData={placeData?.SBIKE_STTS}
            />
          </>
        );
      case "weather":
        return (
          <>
            <h2>{placeData?.LIVE_PPLTN_STTS?.[0]?.AREA_CD || "정보 없음"}</h2>
            <Weather weatherData={placeData?.WEATHER_STTS} />
          </>
        );
      case "search":
        return (
          <PlaceMapSelector
            data={searchData}
            setData={setSearchData}
            regionKeyword={regionKeyword}
            regionId={districtData.id}
            onPreviewPins={setPreviewPlaces}   // ← 태그 선택 시 지도에 미리보기 마커
          />
        );
      case "saved":
        return <p>저장메뉴 빼고 실시간 도시 지하철 정보로?</p>;
      default:
        return null;
    }
  };

  // Sidebar 메뉴
  const sidebarMenus = [
    ...(selectedPlace ? [{ label: "장소", onClick: () => openPanel("place") }] : []),
    { label: "검색", onClick: () => openPanel("search") },
    { label: "교통", onClick: () => openPanel("traffic") },
    { label: "날씨", onClick: () => openPanel("weather") },
    { label: "저장", onClick: () => openPanel("saved") },
  ];

  return (
    <div className="container">
      <Sidebar mode="map" setActivePanel={openPanel} menus={sidebarMenus} />
      <div className="mapWrapper">
        <div ref={mapRef} className="mapContainer" />
       {mapObj && district && activePanel !== "search" && (
          <CustomMapMarkers
            map={mapObj}
            district={district}
            handlePlaceClick={handlePlaceClick}
          />
        )}
      </div>

      {activePanel && (
        <SidePanel
          title={getTitle(activePanel)}
          onClose={closePanel}
          content={renderPanelContent()}
        >
          {renderPanelContent()}
        </SidePanel>
      )}
    </div>
  );
}

// 패널 제목
function getTitle(key) {
  switch (key) {
    case "place":
      return "장소";
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
