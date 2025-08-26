import { useEffect, useRef } from "react";
import styles from "./CustomMapMakers.module.css";
import mapPoints from "../../data/mapPoints";

/* global kakao */

function CustomMapMarkers({ map, district, handlePlaceClick }) {
  const markerRefs = useRef([]); // 커스텀 오버레이 추적

  useEffect(() => {
    if (!map || !district) return;

    // 기존 오버레이 정리
    markerRefs.current.forEach(o => o.setMap(null));
    markerRefs.current = [];

    Object.values(district).forEach((areaList) => {
      if (!Array.isArray(areaList)) return;

      areaList.forEach((place) => {
        const point = mapPoints[place.AREA_CD];
        if (!point) return;

        const latLng = new kakao.maps.LatLng(point.latitude, point.longitude);

        // 마커 DOM
        const circle = document.createElement("div");
        circle.className = styles.circle;
        circle.innerText = place.AREA_NM;

        const container = document.createElement("div");
        container.className = styles.container;

        container.addEventListener("click", () => {
          map.panTo(latLng);
          handlePlaceClick(place); // 👉 부모에서 placeData 로드만 함
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
    });

    return () => {
      markerRefs.current.forEach(o => o.setMap(null));
    };
  }, [map, district, handlePlaceClick]);

  return null;
}

export default CustomMapMarkers;
