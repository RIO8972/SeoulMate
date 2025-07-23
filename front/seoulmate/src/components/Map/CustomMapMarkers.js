import { useEffect } from "react";
import styles from "./CustomMapMakers.module.css";
import mapPoints from "../../data/mapPoints";

/* global kakao */

function CustomMapMarkers({ map, district }) {
  useEffect(() => {
    if (!map || !district) return;

    Object.values(district).forEach((areaList) => {
      if (!Array.isArray(areaList)) return;

      areaList.forEach((place) => {
        const poiId = place?.AREA_CD;
        const name = place?.AREA_NM;
        const point = mapPoints?.[poiId];
        if (!point) return;

        const latLng = new kakao.maps.LatLng(point.latitude, point.longitude);

        const circle = document.createElement("div");
        circle.className = styles.circle;
        circle.innerText = name;

        const container = document.createElement("div");
        container.className = styles.container;
        container.appendChild(circle);

        const overlay = new kakao.maps.CustomOverlay({
          position: latLng,
          content: container,
          yAnchor: 0.5,
          xAnchor: 0.5,
        });

        overlay.setMap(map);
      });
    });
  }, [map, district]);

  return null;
}

export default CustomMapMarkers;
