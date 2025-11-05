// src/pages/DistrictMap/index.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMap, faListUl } from "@fortawesome/free-solid-svg-icons";

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
import Event from "../../components/Event/Event";
import api from "../../api/api";

/* global kakao */

const roadColor = { 원활: "#09CD5E", 서행: "#FFA808", 정체: "#D81D36" };

const PARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="12" fill="#2563eb"/>
  <text x="14" y="18" text-anchor="middle" font-size="14" fill="#fff" font-family="Arial" font-weight="700">P</text>
</svg>`;
const BIKE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="12" fill="#10b981"/>
  <path d="M8 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM11 14h4l2 3m-2-3-2-4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function svgToMarkerImage(svg, w = 28, h = 28) {
  const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    svg.trim()
  )}`;
  const size = new kakao.maps.Size(w, h);
  const options = { offset: new kakao.maps.Point(w / 2, h) };
  return new kakao.maps.MarkerImage(src, size, options);
}

function svgToMarkerImageCenter(svg, w = 20, h = 20) {
  const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    svg.trim()
  )}`;
  const size = new kakao.maps.Size(w, h);
  const options = { offset: new kakao.maps.Point(w / 2, h / 2) }; // 좌표 중앙 정렬
  return new kakao.maps.MarkerImage(src, size, options);
}

// 카테고리 핀: 동그라미 SVG (색은 indigo 계열)
const CAT_DOT_COLOR = "#6366f1";
const makeCatDotImage = (size = 18, color = CAT_DOT_COLOR) => {
  const r = Math.max(1, Math.floor(size / 2) - 2); // 외곽선(2px) 고려
  const c = size / 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${c}" cy="${c}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
    </svg>`;
  return svgToMarkerImageCenter(svg, size, size);
};

const CAT_DOT_IMAGE = makeCatDotImage(18); // 기본
const CAT_DOT_IMAGE_HOVER = makeCatDotImage(24); // 호버 시 조금 크게

const PARK_IMAGE = svgToMarkerImage(PARK_SVG, 28, 28);
const PARK_IMAGE_HOVER = svgToMarkerImage(PARK_SVG, 32, 32);
const BIKE_IMAGE = svgToMarkerImage(BIKE_SVG, 28, 28);
const BIKE_IMAGE_HOVER = svgToMarkerImage(BIKE_SVG, 32, 32);

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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

/** ✅ onClose(선택) 지원: 닫을 때 추가 정리 작업 수행 가능 */
function openOverlay(map, overlayRef, position, box, onClose) {
  if (overlayRef.current) {
    overlayRef.current.setMap(null);
    overlayRef.current = null;
  }
  const overlay = new kakao.maps.CustomOverlay({
    content: box,
    position,
    xAnchor: 0.5,
    yAnchor: 1,
    zIndex: 10000,
  });
  overlay.setMap(map);
  overlayRef.current = overlay;

  const closeBtn = box.querySelector(".mapPopup__close");
  if (closeBtn) {
    closeBtn.onclick = () => {
      overlay.setMap(null);
      if (overlayRef.current === overlay) overlayRef.current = null;
      if (typeof onClose === "function") onClose(); // ← 추가
    };
  }
}

function DistrictMap() {
  const { regionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlaceCode = searchParams.get("place");
  const initialPlaceName = searchParams.get("name");

  const mapRef = useRef(null);
  const [mapObj, setMapObj] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeData, setPlaceData] = useState(null);
  const [searchData, setSearchData] = useState({ places: [] });

  // 분리된 마커 관리
  const categoryMarkersRef = useRef([]); // 카테고리 버튼 결과 핀들
  const previewMarkersRef = useRef([]); // 키워드에서 제목 클릭했을 때 단일 프리뷰 핀
  const roadLinesRef = useRef([]);
  const parkingMarkersRef = useRef([]);
  const bikeMarkersRef = useRef([]);
  const overlayRef = useRef(null);

  const [panelLoading, setPanelLoading] = useState(false);
  const reqSeqRef = useRef(0);

  const districtData = seoulDistrict.find((i) => i.id === regionId);
  const regionKeyword = districtData?.keyWord;

  // 키워드 검색: 제목 클릭 시 한 개 핀 + 팝업
  const focusPlaceOnMap = useCallback(
    (p) => {
      if (!mapObj) return;
      const lat = parseFloat(p.y ?? p.lat);
      const lng = parseFloat(p.x ?? p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      // 기존 프리뷰 핀/팝업만 정리 (카테고리 핀은 유지)
      previewMarkersRef.current.forEach((m) => m.setMap(null));
      previewMarkersRef.current = [];
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }

      const pos = new kakao.maps.LatLng(lat, lng);

      const marker = new kakao.maps.Marker({
        map: mapObj,
        position: pos,
        title: p.place_name || p.name || "",
        zIndex: 9,
      });
      previewMarkersRef.current = [marker];

      const openPlaceOverlay = () => {
        const rows = [
          {
            label: "주소",
            value: p.road_address_name || p.address_name || p.address || "-",
          },
          p.place_url || p.url
            ? {
                label: "링크",
                valueHtml: `<a href="${
                  p.place_url || p.url
                }" target="_blank" rel="noreferrer">바로가기</a>`,
              }
            : null,
        ].filter(Boolean);

        const box = buildPopupBox(p.place_name || p.name || "장소", rows);

        // ✅ 닫기(X) 누르면 프리뷰 핀 지우기
        const removePreviewPin = () => {
          marker.setMap(null);
          // 안전하게 배열도 비우기
          previewMarkersRef.current.forEach((m) => m.setMap(null));
          previewMarkersRef.current = [];
        };

        openOverlay(mapObj, overlayRef, pos, box, removePreviewPin);
      };

      // 최초 1회 열기 + 다시 클릭해도 열리도록 리스너
      openPlaceOverlay();
      kakao.maps.event.addListener(marker, "click", openPlaceOverlay);

      mapObj.panTo(pos);
      setActivePanel((prev) => prev ?? "search");
    },
    [mapObj]
  );

  // 카테고리 버튼: 결과를 즉시 지도에만 뿌리기 (동그라미 SVG)
  const plotCategoryPins = useCallback(
    (list) => {
      categoryMarkersRef.current.forEach((m) => m.setMap(null));
      categoryMarkersRef.current = [];
      if (!mapObj) return;

      const bounds = new kakao.maps.LatLngBounds();
      const newMarkers = [];

      list.forEach((p) => {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
        const pos = new kakao.maps.LatLng(p.lat, p.lng);
        bounds.extend(pos);

        const marker = new kakao.maps.Marker({
          map: mapObj,
          position: pos,
          title: p.name || "",
          image: CAT_DOT_IMAGE, // 동그라미 아이콘
          zIndex: 5,
        });

        kakao.maps.event.addListener(marker, "mouseover", () => {
          marker.setImage(CAT_DOT_IMAGE_HOVER);
          marker.setZIndex(8);
          if (mapRef.current) mapRef.current.style.cursor = "pointer";
        });
        kakao.maps.event.addListener(marker, "mouseout", () => {
          marker.setImage(CAT_DOT_IMAGE);
          marker.setZIndex(5);
          if (mapRef.current) mapRef.current.style.cursor = "";
        });

        kakao.maps.event.addListener(marker, "click", () => {
          const rows = [
            { label: "주소", value: p.address || "-" },
            p.url
              ? {
                  label: "링크",
                  valueHtml: `<a href="${p.url}" target="_blank" rel="noreferrer">바로가기</a>`,
                }
              : null,
          ].filter(Boolean);
          const box = buildPopupBox(p.name || "장소", rows);
          // 카테고리 핀은 닫아도 핀 유지 → onClose 전달 안 함
          openOverlay(mapObj, overlayRef, pos, box);
        });

        newMarkers.push(marker);
      });

      categoryMarkersRef.current = newMarkers;
      if (!bounds.isEmpty()) mapObj.setBounds(bounds);
    },
    [mapObj]
  );

  // 패널 전환 시 정리(검색에서 벗어나면 카테고리 핀/프리뷰 핀/팝업 정리)
  useEffect(() => {
    if (activePanel !== "search") {
      categoryMarkersRef.current.forEach((m) => m.setMap(null));
      categoryMarkersRef.current = [];
      previewMarkersRef.current.forEach((m) => m.setMap(null));
      previewMarkersRef.current = [];
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    }
  }, [activePanel]);

  useEffect(() => {
    if (!selectedPlace) setActivePanel(null);
  }, [selectedPlace]);

  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current || !districtData) return;
    const { lat, lng, text } = districtData;

    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(lat, lng),
      level: 5,
    });
    setMapObj(map);
  }, [districtData]);

  // 리스트에서 넘어온 place 쿼리 처리
  useEffect(() => {
    if (!initialPlaceCode) return;
    setSelectedPlace({
      AREA_CD: initialPlaceCode,
      AREA_NM: initialPlaceName || "",
    });
    setActivePanel((prev) => prev || "place");
    axios
      .get(
        `https://seoul-mate.co.kr/cityapi/cache/regions/city/districts/${initialPlaceCode}`
      )
      .then((res) => setPlaceData(res.data))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlaceCode]);

  // 구 경계 마스크 + 외곽선
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

  const handleSaveEventPlace = useCallback(async (ev, poi, source) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        alert("로그인이 필요합니다.");
        return false;
      }
      if (!poi || !poi.id) {
        alert("저장할 장소 정보가 없습니다.");
        return false;
      }

      const dto = {
        placeId: String(poi.id),
        name: ev?.EVENT_NM ?? "",
        lat: String(poi.y ?? ev?.EVENT_Y ?? ""),
        lng: String(poi.x ?? ev?.EVENT_X ?? ""),
        address:
          poi.address_name || poi.road_address_name || ev?.EVENT_PLACE || "",
        url: poi.place_url ?? ev?.URL ?? "",
        category: "행사",
      };

      const res = await api.post("/carts", dto);

      console.log("[createCart OK]", { dto, source, resStatus: res.status });
      return true;
    } catch (err) {
      console.error("[createCart FAIL]", err);
      const status = err?.response?.status;
      if (status === 401) alert("로그인이 필요합니다.");
      else if (status === 409) alert("이미 저장된 장소입니다.");
      else alert("저장 실패");
      return false;
    }
  }, []);

  const handlePlaceClick = useCallback((place) => {
    setSelectedPlace(place);
    setActivePanel((prev) => prev || "place");
    const seq = ++reqSeqRef.current;
    setPanelLoading(true);
    axios
      .get(
        `https://seoul-mate.co.kr/cityapi/cache/regions/city/districts/${place.AREA_CD}`
      )
      .then((res) => {
        if (seq === reqSeqRef.current) setPlaceData(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (seq === reqSeqRef.current) setPanelLoading(false);
      });
  }, []);

  const openPanel = useCallback(
    (type) => {
      // 지역(마커) 선택 전에는 어떤 패널도 열지 않음
      if (!selectedPlace) return;
      setActivePanel(type);
    },
    [selectedPlace]
  );

  const closePanel = () => {
    setActivePanel(null);
    setSelectedPlace(null);
    setPlaceData(null);

    roadLinesRef.current.forEach((l) => l.setMap(null));
    roadLinesRef.current = [];
    parkingMarkersRef.current.forEach((m) => m.setMap(null));
    parkingMarkersRef.current = [];
    bikeMarkersRef.current.forEach((m) => m.setMap(null));
    bikeMarkersRef.current = [];

    categoryMarkersRef.current.forEach((m) => m.setMap(null));
    categoryMarkersRef.current = [];
    previewMarkersRef.current.forEach((m) => m.setMap(null));
    previewMarkersRef.current = [];

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
  };

  // place 화면 도로 라인
  useEffect(() => {
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

      kakao.maps.event.addListener(hitLine, "mouseover", () => {
        if (mapRef.current) mapRef.current.style.cursor = "pointer";
      });
      kakao.maps.event.addListener(hitLine, "mouseout", () => {
        if (mapRef.current) mapRef.current.style.cursor = "";
      });

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

  // parking 화면 주차/따릉이
  useEffect(() => {
    parkingMarkersRef.current.forEach((m) => m.setMap(null));
    parkingMarkersRef.current = [];
    bikeMarkersRef.current.forEach((m) => m.setMap(null));
    bikeMarkersRef.current = [];

    if (!mapObj) return;
    if (activePanel !== "parking") return;

    const parks = placeData?.PRK_STTS;
    if (Array.isArray(parks) && parks.length > 0) {
      const byCode = new Map();
      parks.forEach((p) => {
        const key = p.PRK_CD || `${p.LAT},${p.LNG}`;
        if (!byCode.has(key)) byCode.set(key, p);
      });

      const parkMarkers = [];
      byCode.forEach((p) => {
        const lat = Number(p.LAT);
        const lng = Number(p.LNG);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const pos = new kakao.maps.LatLng(lat, lng);
        const marker = new kakao.maps.Marker({
          map: mapObj,
          position: pos,
          title: p.PRK_NM,
          image: PARK_IMAGE,
          zIndex: 3,
        });

        kakao.maps.event.addListener(marker, "mouseover", () => {
          marker.setImage(PARK_IMAGE_HOVER);
          marker.setZIndex(6);
          if (mapRef.current) mapRef.current.style.cursor = "pointer";
        });
        kakao.maps.event.addListener(marker, "mouseout", () => {
          marker.setImage(PARK_IMAGE);
          marker.setZIndex(3);
          if (mapRef.current) mapRef.current.style.cursor = "";
        });

        const cpcty = p.CPCTY == null || p.CPCTY === "" ? "-" : p.CPCTY;
        const paid = p.PAY_YN === "Y" ? "유료" : "무료";
        const addr = p.ROAD_ADDR || p.ADDRESS || "-";
        const live = p.CUR_PRK_YN === "Y" ? p.CUR_PRK_TIME || "-" : null;

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

        parkMarkers.push(marker);
      });
      parkingMarkersRef.current = parkMarkers;
    }

    const bikes = placeData?.SBIKE_STTS;
    if (Array.isArray(bikes) && bikes.length > 0) {
      const bySpot = new Map();
      bikes.forEach((b) => {
        const lat = Number(
          b.SBIKE_Y ?? b.LAT ?? b.lat ?? b.latitude ?? b.Y ?? b.y
        );
        const lng = Number(
          b.SBIKE_X ?? b.LNG ?? b.lng ?? b.longitude ?? b.X ?? b.x
        );
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const key = b.SBIKE_SPOT_ID || `${lat},${lng}`;
        if (!bySpot.has(key)) bySpot.set(key, { ...b, __lat: lat, __lng: lng });
      });

      const bikeMarkers = [];
      bySpot.forEach((b) => {
        const pos = new kakao.maps.LatLng(b.__lat, b.__lng);
        const marker = new kakao.maps.Marker({
          map: mapObj,
          position: pos,
          title: b.SBIKE_SPOT_NM,
          image: BIKE_IMAGE,
          zIndex: 5,
        });
        kakao.maps.event.addListener(marker, "mouseover", () => {
          marker.setImage(BIKE_IMAGE_HOVER);
          marker.setZIndex(8);
          if (mapRef.current) mapRef.current.style.cursor = "pointer";
        });
        kakao.maps.event.addListener(marker, "mouseout", () => {
          marker.setImage(BIKE_IMAGE);
          marker.setZIndex(5);
          if (mapRef.current) mapRef.current.style.cursor = "";
        });

        const total = Number(b.SBIKE_RACK_CNT) || null;
        const empty = Number(b.SBIKE_PARKING_CNT);
        const avail = total
          ? `${isNaN(empty) ? "-" : empty}/${total}`
          : isNaN(empty)
          ? "-"
          : empty;

        kakao.maps.event.addListener(marker, "click", () => {
          const rows = [{ label: "잔여/총", value: String(avail) }];
          const box = buildPopupBox(b.SBIKE_SPOT_NM || "따릉이 거치소", rows);
          openOverlay(mapObj, overlayRef, pos, box);
        });

        bikeMarkers.push(marker);
      });

      bikeMarkersRef.current = bikeMarkers;
    }
    return () => {
      parkingMarkersRef.current.forEach((m) => m.setMap(null));
      parkingMarkersRef.current = [];
      bikeMarkersRef.current.forEach((m) => m.setMap(null));
      bikeMarkersRef.current = [];
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [mapObj, activePanel, placeData]);

  const renderPanelContent = () => {
    const needsPlace = ["place", "parking", "weather", "event"].includes(
      activePanel || ""
    );
    if (needsPlace && !placeData) {
      return selectedPlace ? (
        <p>요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      ) : (
        <p>먼저 지도에서 장소를 선택하세요.</p>
      );
    }

    switch (activePanel) {
      case "place": {
        const info = placeData?.LIVE_PPLTN_STTS?.[0];
        if (!info) return <p>로딩 중…</p>;
        return (
          <>
            <h2>지금 {selectedPlace?.AREA_NM}은(는)</h2>
            <TransportSummary data={placeData} />
            <PopulationChart info={info} />
            <GenderChart info={info} />
            <AgeChart info={info} />
          </>
        );
      }
      case "parking":
        return (
          <>
            <h2>{placeData?.LIVE_PPLTN_STTS?.[0]?.AREA_NM || "정보 없음"}</h2>
            <Traffic
              parkingData={placeData?.PRK_STTS}
              sbikeData={placeData?.SBIKE_STTS}
            />
          </>
        );
      case "weather":
        return (
          <>
            <h2>{placeData?.LIVE_PPLTN_STTS?.[0]?.AREA_NM || "정보 없음"}</h2>
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
            onPlotCategoryPins={plotCategoryPins} // 카테고리 버튼용 핀
            onFocusPlace={focusPlaceOnMap} // 키워드 제목 클릭용 프리뷰 핀 + 팝업
          />
        );
      case "event":
        return (
          <>
            <h2>{placeData?.LIVE_PPLTN_STTS?.[0]?.AREA_NM || "정보 없음"}</h2>
            <Event
              event={placeData.EVENT_STTS}
              onSavePlace={handleSaveEventPlace}
            />
          </>
        );
      default:
        return null;
    }
  };

  // 초기 렌더링(선택 전)에는 메뉴 없음 → 사이드바에 항목이 안 뜸
  const sidebarMenus = selectedPlace
    ? [
        { label: "장소", onClick: () => openPanel("place") },
        { label: "검색", onClick: () => openPanel("search") },
        { label: "주차", onClick: () => openPanel("parking") },
        { label: "날씨", onClick: () => openPanel("weather") },
        { label: "행사", onClick: () => openPanel("event") },
      ]
    : [];

  return (
    <div className="container">
      <Sidebar mode="map" setActivePanel={openPanel} menus={sidebarMenus} />

      <div className="mapWrapper">
        <div className="view-toggle" role="group" aria-label="보기 전환">
          <button type="button" className="vt-btn active">
            <FontAwesomeIcon icon={faMap} className="vt-ico" />
            지도로 보기
          </button>
          <button
            type="button"
            className="vt-btn"
            onClick={() =>
              navigate(`/districts/${encodeURIComponent(regionId)}`)
            }
          >
            <FontAwesomeIcon icon={faListUl} className="vt-ico" />
            리스트로 보기
          </button>
        </div>

        <div ref={mapRef} className="mapContainer" />

        {mapObj && activePanel !== "search" && (
          <CustomMapMarkers
            map={mapObj}
            regionId={regionId}
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

function getTitle(key) {
  switch (key) {
    case "place":
      return "장소";
    case "search":
      return "검색";
    case "parking":
      return "주차";
    case "weather":
      return "날씨";
    case "event":
      return "행사";
    default:
      return "";
  }
}

export default DistrictMap;
