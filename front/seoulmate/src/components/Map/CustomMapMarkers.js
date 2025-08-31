import { useEffect, useRef, useMemo } from "react";
import styles from "./CustomMapMakers.module.css";
import mapPoints from "../../data/mapPoints";

/* global kakao */

function CustomMapMarkers({ map, regionId, handlePlaceClick }) {
  const markerRefs = useRef([]); // 커스텀 오버레이 추적

  // regionId(예: "Geumcheon-gu")에 해당하는 POI들만 준비
  const regionPOIs = useMemo(() => {
    const regionMap = mapPoints?.[regionId];
    if (!regionMap || typeof regionMap !== "object") return [];

    return Object.entries(regionMap)
      .map(([poiCode, info]) => {
        const lat = parseFloat(info.latitude ?? info.lat);
        const lng = parseFloat(info.longitude ?? info.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          poiCode,
          placeName: info.place_name ?? poiCode,
          lat,
          lng,
        };
      })
      .filter(Boolean);
  }, [regionId]);

  useEffect(() => {
    if (!map) return;

    // 기존 오버레이 정리
    markerRefs.current.forEach((o) => o.setMap(null));
    markerRefs.current = [];

    // 해당 자치구의 POI만 표시
    regionPOIs.forEach(({ poiCode, placeName, lat, lng }) => {
      const latLng = new kakao.maps.LatLng(lat, lng);

      // 마커 DOM
      const circle = document.createElement("div");
      circle.className = styles.circle;
      circle.innerText = placeName;

      const container = document.createElement("div");
      container.className = styles.container;

      container.addEventListener("click", () => {
        map.panTo(latLng);
        // 부모에서 기대하는 최소 형태로 전달
        handlePlaceClick({
          AREA_CD: poiCode,
          AREA_NM: placeName,
        });
      });

      container.appendChild(circle);

      const overlay = new kakao.maps.CustomOverlay({
        position: latLng,
        content: container,
        xAnchor: 0.5,
        yAnchor: 0.5,
      });
      overlay.setMap(map);
      markerRefs.current.push(overlay);
    });

    return () => {
      markerRefs.current.forEach((o) => o.setMap(null));
    };
  }, [map, regionPOIs, handlePlaceClick]);

  return null;
}

export default CustomMapMarkers;

// import { useEffect, useRef } from "react";
// import styles from "./CustomMapMakers.module.css";
// import mapPoints from "../../data/mapPoints";

// /* global kakao */

// function CustomMapMarkers({ map, district, handlePlaceClick }) {
//   const markerRefs = useRef([]); // 커스텀 오버레이 추적

//   useEffect(() => {
//     if (!map || !district) return;

//     // 기존 오버레이 정리
//     markerRefs.current.forEach(o => o.setMap(null));
//     markerRefs.current = [];

//     Object.values(district).forEach((areaList) => {
//       if (!Array.isArray(areaList)) return;

//       areaList.forEach((place) => {
//         const point = mapPoints[place.AREA_CD];
//         if (!point) return;

//         const latLng = new kakao.maps.LatLng(point.latitude, point.longitude);

//         // 마커 DOM
//         const circle = document.createElement("div");
//         circle.className = styles.circle;
//         circle.innerText = place.AREA_NM;

//         const container = document.createElement("div");
//         container.className = styles.container;

//         container.addEventListener("click", () => {
//           map.panTo(latLng);
//           handlePlaceClick(place); // 👉 부모에서 placeData 로드만 함
//         });

//         container.appendChild(circle);

//         const overlay = new kakao.maps.CustomOverlay({
//           position: latLng,
//           content: container,
//           xAnchor: 0.5,
//           yAnchor: 0.5,
//         });
//         overlay.setMap(map);
//         markerRefs.current.push(overlay);
//       });
//     });

//     return () => {
//       markerRefs.current.forEach(o => o.setMap(null));
//     };
//   }, [map, district, handlePlaceClick]);

//   return null;
// }

// export default CustomMapMarkers;
