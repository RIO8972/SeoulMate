import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styles from "./CourseDetailPage.module.css";
import Header from "../../components/Header";
import { FaBus, FaCar } from "react-icons/fa";
import api from "../../api/api";

/* global kakao */

// ---- 유틸 ----
const formatDateTime = (v) => {
  if (!v) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  const onlyDateStr = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = v instanceof Date ? v : new Date(onlyDateStr ? `${v}T00:00:00` : v);
  if (Number.isNaN(+d)) return String(v).replace("T", " ").slice(0, 16);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  if (onlyDateStr) return `${yyyy}-${mm}-${dd}`;
  const HH = pad(d.getHours());
  const MM = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
};

const extractDistrict = (address) => {
  if (!address) return "";
  const parts = String(address).trim().split(/\s+/);
  return parts[1] || "";
};

const minutesBetween = (a, b) => {
  if (!a || !b) return null;
  const lat1 = Number(a.lat), lng1 = Number(a.lng);
  const lat2 = Number(b.lat), lng2 = Number(b.lng);
  if ([lat1, lng1, lat2, lng2].some((n) => !Number.isFinite(n))) return null;

  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const distKm = 2 * R * Math.asin(Math.sqrt(s));
  const walkingKmPerMin = 4 / 60;
  return Math.round(distKm / walkingKmPerMin);
};

// ────────────────────────────────
// 팝업 유틸 (DistrictMap과 동일 스타일)
// ────────────────────────────────
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
    zIndex: 10000,
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

const setMapCursor = (map, value = "") => {
  try {
    const node = typeof map?.getNode === "function" ? map.getNode() : null;
    if (node && node.style) node.style.cursor = value;
  } catch {}
};

// URL 그대로 사용
const CITYAPI_BASE =
  import.meta.env?.VITE_CITYAPI_BASE ||
  process.env.REACT_APP_CITYAPI_BASE ||
  "/cityapi";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // 서버 데이터
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [deleting, setDeleting] = useState(false);

  // 지도/도형 refs
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef = useRef([]);

  // 구간별 라인 저장: pt / car  => { [legIdx]: Polyline[] }  (color + hit 쌍)
  const ptLinesByLegRef = useRef({});
  const carLinesByLegRef = useRef({});

  // 공용 팝업(오버레이)
  const overlayRef = useRef(null);

  // 로딩 상태
  const [ptLoading, setPtLoading] = useState({});
  const [carLoading, setCarLoading] = useState({});

  // 상단 토글: 'pt' | 'car'
  const [routeMode, setRouteMode] = useState("pt");

  // 현재 선택된 구간 인덱스(하나만 선택)
  const [selectedLeg, setSelectedLeg] = useState(null);

  // 코스 조회
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/courses/${courseId}`);
        setCourse(data);
      } catch (e) {
        console.error("[course detail] error:", e);
        setErr("코스를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // 지도 1회 초기화 + 마커(코스 바뀔 때만)
  useEffect(() => {
    const places = course?.places || [];
    if (!window.kakao?.maps || !mapRef.current || places.length === 0) return;

    const first = places[0];
    const center = new kakao.maps.LatLng(Number(first.lat), Number(first.lng));
    const map =
      mapObjRef.current ||
      new kakao.maps.Map(mapRef.current, { center, level: 5 });
    mapObjRef.current = map;

    // 기존 마커/라인/팝업 정리
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    Object.values(ptLinesByLegRef.current).forEach((arr) =>
      (arr || []).forEach((pl) => pl.setMap(null))
    );
    Object.values(carLinesByLegRef.current).forEach((arr) =>
      (arr || []).forEach((pl) => pl.setMap(null))
    );
    ptLinesByLegRef.current = {};
    carLinesByLegRef.current = {};
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    setPtLoading({});
    setCarLoading({});
    setSelectedLeg(null);

    // 마커 + 초기 bounds
    const bounds = new kakao.maps.LatLngBounds();
    places.forEach((p) => {
      const lat = Number(p.lat), lng = Number(p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const pos = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ map, position: pos, title: p.name });
      markersRef.current.push(marker);
      bounds.extend(pos);
    });
    if (!bounds.isEmpty()) map.setBounds(bounds);

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      Object.values(ptLinesByLegRef.current).forEach((arr) =>
        (arr || []).forEach((pl) => pl.setMap(null))
      );
      Object.values(carLinesByLegRef.current).forEach((arr) =>
        (arr || []).forEach((pl) => pl.setMap(null))
      );
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [course]);

  // ---- helpers: hide/show ----
  const hideAllLines = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    Object.values(ptLinesByLegRef.current).forEach((arr) =>
      (arr || []).forEach((pl) => pl.setMap(null))
    );
    Object.values(carLinesByLegRef.current).forEach((arr) =>
      (arr || []).forEach((pl) => pl.setMap(null))
    );
  }, []);

  const showOnlyLeg = useCallback((kind, legIdx) => {
    const map = mapObjRef.current;
    if (!map) return;
    hideAllLines();
    if (kind === "pt") {
      (ptLinesByLegRef.current[legIdx] || []).forEach((pl) => pl.setMap(map));
    } else {
      (carLinesByLegRef.current[legIdx] || []).forEach((pl) => pl.setMap(map));
    }
  }, [hideAllLines]);

  // 상단 토글/선택 구간 변화 시 적용(이미 만들어진 라인만)
  useEffect(() => {
    if (selectedLeg == null) {
      hideAllLines();
      return;
    }
    showOnlyLeg(routeMode, selectedLeg);
  }, [routeMode, selectedLeg, hideAllLines, showOnlyLeg]);

  // ───────── 구간별 아이콘 클릭 (하나만 선택) ─────────
  const onClickLegBus = useCallback(async (idx) => {
    if (routeMode !== "pt") return;
    const map = mapObjRef.current;
    if (!map) return;

    // 같은 아이콘 다시 클릭 → 해제
    if (selectedLeg === idx) {
      setSelectedLeg(null);
      hideAllLines();
      return;
    }

    setSelectedLeg(idx); // UI 활성화

    // 이미 라인이 있으면 바로 표시
    if (ptLinesByLegRef.current[idx]?.length) {
      showOnlyLeg("pt", idx);
      return;
    }

    // 최초 로딩
    const places = course?.places || [];
    const a = places[idx], b = places[idx + 1];
    if (!a || !b) return;

    setPtLoading((p) => ({ ...p, [idx]: true }));
    try {
      await drawPublicRouteLeg(
        { lat: Number(a.lat), lng: Number(a.lng) },
        { lat: Number(b.lat), lng: Number(b.lng) },
        idx
      );
      // 생성 직후 해당 구간만 즉시 표시
      showOnlyLeg("pt", idx);
    } catch (e) {
      console.warn("PT 라인 생성 실패:", e);
      alert("대중교통 경로를 불러오지 못했습니다.");
      setSelectedLeg(null);
      hideAllLines();
    } finally {
      setPtLoading((p) => ({ ...p, [idx]: false }));
    }
  }, [course, routeMode, selectedLeg, hideAllLines, showOnlyLeg]);

  const onClickLegCar = useCallback(async (idx) => {
    if (routeMode !== "car") return;
    const map = mapObjRef.current;
    if (!map) return;

    if (selectedLeg === idx) {
      setSelectedLeg(null);
      hideAllLines();
      return;
    }

    setSelectedLeg(idx);

    if (carLinesByLegRef.current[idx]?.length) {
      showOnlyLeg("car", idx);
      return;
    }

    const places = course?.places || [];
    const a = places[idx], b = places[idx + 1];
    if (!a || !b) return;

    setCarLoading((p) => ({ ...p, [idx]: true }));
    try {
      await drawCarRouteLeg(
        { lat: Number(a.lat), lng: Number(a.lng) },
        { lat: Number(b.lat), lng: Number(b.lng) },
        idx
      );
      showOnlyLeg("car", idx);
    } catch (e) {
      console.warn("CAR 라인 생성 실패:", e);
      alert("자동차 경로를 불러오지 못했습니다.");
      setSelectedLeg(null);
      hideAllLines();
    } finally {
      setCarLoading((p) => ({ ...p, [idx]: false }));
    }
  }, [course, routeMode, selectedLeg, hideAllLines, showOnlyLeg]);

  // ── PT: 요약 → mapObj → lane → Polyline (이중 라인 + 클릭 팝업) ──
  const drawPublicRouteLeg = useCallback(async (A, B, legIdx) => {
    const map = mapObjRef.current;
    if (!map) return;

    const url1 =
      `https://seoul-mate.co.kr/cityapi/search/route?mode=public-transport` +
      `&start_x=${A.lng}&start_y=${A.lat}&end_x=${B.lng}&end_y=${B.lat}`;
    const res1 = await fetch(url1);
    if (!res1.ok) throw new Error("public route fetch failed");
    const j1 = await res1.json();

    const paths = j1?.result?.path || j1?.result?.paths || [];
    if (!paths.length) throw new Error("no path from summary");
    const firstPath = paths.find((p) => p.pathType === 1) || paths[0];

    // subPath 메타(지하철/버스)
    const segMetas = (firstPath?.subPath || [])
      .filter((sp) => sp.trafficType === 1 || sp.trafficType === 2)
      .map((sp) => {
        const isSubway = sp.trafficType === 1;
        const lane0 = Array.isArray(sp.lane) ? sp.lane[0] : null;
        return {
          kind: isSubway ? "subway" : "bus",
          name: isSubway ? lane0?.name : lane0?.busNo,
          code: isSubway ? lane0?.subwayCode : lane0?.type,
          startName: sp.startName,
          endName: sp.endName,
          stationCount: sp.stationCount,
          sectionTime: sp.sectionTime,
          passStations: sp?.passStopList?.stations?.map((s) => s.stationName) || [],
        };
      });

    const mapObj =
      firstPath?.info?.mapObj ||
      firstPath?.info?.mapOBJ ||
      firstPath?.info?.map_object;
    if (!mapObj) throw new Error("mapObj missing");

    const url2 = `https://seoul-mate.co.kr/cityapi/search/route/lane?mapObj=${encodeURIComponent(mapObj)}`;
    const res2 = await fetch(url2);
    if (!res2.ok) throw new Error("loadLane fetch failed");
    const j2 = await res2.json();

    const lanes = j2?.result?.lane || [];
    if (!lanes.length) throw new Error("lane empty");

    const pickColor = (t) =>
      t === 1 ? "#0032A0" :
      t === 2 ? "#00B140" :
      t === 3 ? "#FC4C02" :
      t === 4 ? "#00A9E0" :
      t === 5 ? "#A05EB5" :
      t === 6 ? "#A9431E" :
      t === 7 ? "#67823A" :
      t === 8 ? "#E31C79" :
      t === 9 ? "#8C8279" :
      t === 100 ? "#FF8800" :
      t === 101 ? "#68ADE0" : "#808080";

    const created = [];
    let segIdx = 0;

    lanes.forEach((lane) => {
      const color = pickColor(lane.type);
      (lane.section || []).forEach((section) => {
        const graph = section.graphPos || [];
        if (!graph.length) return;

        const path = graph.map((pos) => new kakao.maps.LatLng(pos.y, pos.x));
        const meta = segMetas[segIdx] || null;

        // 얇은 컬러 라인
        const colorLine = new kakao.maps.Polyline({
          map: null,
          path,
          strokeWeight: 4,
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeStyle: "solid",
          lineJoin: "round",
          lineCap: "round",
          zIndex: 1,
          clickable: false,
        });

        // 두꺼운 히트라인
        const hitLine = new kakao.maps.Polyline({
          map: null,
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
          map.setDraggable(false);
          setMapCursor(map, "pointer");
        });
        kakao.maps.event.addListener(hitLine, "mouseout", () => {
          map.setDraggable(true);
          setMapCursor(map, "");
        });
        kakao.maps.event.addListener(hitLine, "click", (e) => {
          const rows = [];
          if (meta) {
            rows.push(
              { label: meta.kind === "subway" ? "노선" : "버스", value: meta.name || "-" },
              { label: "출발", value: meta.startName || "-" },
              { label: "도착", value: meta.endName || "-" },
              { label: "정거장", value: String(meta.stationCount ?? "-") },
              { label: "소요", value: `${meta.sectionTime ?? "-"} 분` }
            );
            if (meta.passStations?.length) {
              rows.push({
                label: "정차",
                value: meta.passStations.join(" → "),
              });
            }
          }
          const title =
            meta?.kind === "subway"
              ? `${meta.name || "지하철"} 구간`
              : meta?.kind === "bus"
              ? `버스 ${meta.name || ""} 구간`
              : lane.type === 1
              ? "지하철"
              : lane.type === 2
              ? "버스"
              : "대중교통";

          const box = buildPopupBox(title, rows);
          openOverlay(map, overlayRef, e.latLng, box);
        });

        created.push(colorLine, hitLine);
      });

      segIdx += 1;
    });

    ptLinesByLegRef.current[legIdx] = created;
  }, []);

  // ── CAR: road 단위 color/hit 라인 + 클릭 팝업 ──
  const drawCarRouteLeg = useCallback(async (A, B, legIdx) => {
    const map = mapObjRef.current;
    if (!map) return;

    const url =
      `https://seoul-mate.co.kr/cityapi/search/route?mode=car` +
      `&start_x=${A.lng}&start_y=${A.lat}&end_x=${B.lng}&end_y=${B.lat}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("car route fetch failed");
    const json = await res.json();

    const sections = json?.routes?.[0]?.sections || [];
    const created = [];
    const color = "#2E7DFF";

    if (sections.length) {
      sections.forEach((sec) => {
        (sec.roads || []).forEach((road) => {
          const v = road.vertexes || [];
          if (!v.length) return;

          const path = [];
          for (let i = 0; i < v.length; i += 2) {
            const x = v[i], y = v[i + 1];
            if (Number.isFinite(x) && Number.isFinite(y)) {
              path.push(new kakao.maps.LatLng(y, x));
            }
          }
          if (!path.length) return;

          const colorLine = new kakao.maps.Polyline({
            map: null,
            path,
            strokeWeight: 5,
            strokeColor: color,
            strokeOpacity: 0.95,
            strokeStyle: "solid",
            lineJoin: "round",
            lineCap: "round",
            zIndex: 1,
            clickable: false,
          });

          const hitLine = new kakao.maps.Polyline({
            map: null,
            path,
            strokeWeight: 14,
            strokeColor: color,
            strokeOpacity: 0.2,
            strokeStyle: "solid",
            lineJoin: "round",
            lineCap: "round",
            zIndex: 2,
            clickable: true,
          });

          kakao.maps.event.addListener(hitLine, "mouseover", () => {
            map.setDraggable(false);
            setMapCursor(map, "pointer");
          });
          kakao.maps.event.addListener(hitLine, "mouseout", () => {
            map.setDraggable(true);
            setMapCursor(map, "");
          });
          kakao.maps.event.addListener(hitLine, "click", (e) => {
            const name = road.name && road.name.trim().length ? road.name : "이름 없는 도로";
            const rows = [
              { label: "거리", value: `${(road.distance ?? 0).toLocaleString()} m` },
              { label: "예상", value: `${Math.round((road.duration ?? 0) / 60)} 분` },
            ];
            if (road.traffic_speed != null) {
              rows.push({ label: "속도", value: `${road.traffic_speed} km/h` });
            }
            const box = buildPopupBox(name, rows);
            openOverlay(map, overlayRef, e.latLng, box);
          });

          created.push(colorLine, hitLine);
        });
      });
    } else if (json?.route?.traoptimal?.[0]?.path?.length) {
      // Fallback: 한 줄 경로(클릭 시 총 거리/시간 정도만 보여 주기)
      const path = json.route.traoptimal[0].path.map(([x, y]) => new kakao.maps.LatLng(y, x));

      const colorLine = new kakao.maps.Polyline({
        map: null,
        path,
        strokeWeight: 5,
        strokeColor: color,
        strokeOpacity: 0.95,
        strokeStyle: "solid",
        lineJoin: "round",
        lineCap: "round",
        zIndex: 1,
        clickable: false,
      });

      const hitLine = new kakao.maps.Polyline({
        map: null,
        path,
        strokeWeight: 14,
        strokeColor: color,
        strokeOpacity: 0.2,
        strokeStyle: "solid",
        lineJoin: "round",
        lineCap: "round",
        zIndex: 2,
        clickable: true,
      });

      kakao.maps.event.addListener(hitLine, "mouseover", () => {
        map.setDraggable(false);
        setMapCursor(map, "pointer");
      });
      kakao.maps.event.addListener(hitLine, "mouseout", () => {
        map.setDraggable(true);
        setMapCursor(map, "");
      });
      kakao.maps.event.addListener(hitLine, "click", (e) => {
        const totalDist = json?.routes?.[0]?.summary?.distance ?? null;
        const totalDur = json?.routes?.[0]?.summary?.duration ?? null;
        const rows = [];
        if (totalDist != null) rows.push({ label: "총 거리", value: `${(totalDist).toLocaleString()} m` });
        if (totalDur != null) rows.push({ label: "총 시간", value: `${Math.round(totalDur / 60)} 분` });
        const box = buildPopupBox("자동차 경로", rows);
        openOverlay(map, overlayRef, e.latLng, box);
      });

      created.push(colorLine, hitLine);
    } else {
      throw new Error("car path empty");
    }

    carLinesByLegRef.current[legIdx] = [
      ...(carLinesByLegRef.current[legIdx] || []),
      ...created,
    ];
  }, []);

  // 지역구
  const region = useMemo(() => {
    const addr = course?.places?.[0]?.address;
    return extractDistrict(addr) || "코스";
  }, [course]);

  // 삭제
  const onDelete = async () => {
    if (deleting) return;
    if (!window.confirm("이 코스를 삭제할까요? 복구할 수 없습니다.") ) return;

    try {
      setDeleting(true);
      await api.delete(`/courses/${courseId}`);
      alert("코스를 삭제했습니다.");
      navigate("/mypage?tab=courses", { replace: true });
    } catch (e) {
      console.error("[course delete] error:", e);
      const code = e?.response?.status;
      if (code === 401) alert("로그인이 필요합니다.");
      else alert("코스 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.inner}>불러오는 중…</div>
      </div>
    );
  if (err)
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.inner} style={{ color: "#d33" }}>
          {err}
        </div>
      </div>
    );
  if (!course)
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.inner}>코스를 찾을 수 없습니다.</div>
      </div>
    );

  const steps = Array.isArray(course.places) ? course.places : [];
  const when = formatDateTime(course.datetime || course.date);

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.inner}>
        {/* 좌측: 타이틀 + 타임라인 */}
        <aside className={styles.sidebar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => window.history.back()}
          >
            ← 뒤로
          </button>

          <div className={styles.titleBar}>
            <h1 className={styles.title}>{course.title}</h1>
            <div className={styles.actions}>
              <Link
                to={`/courses/${courseId}/edit`}
                state={{ course }}
                className={styles.editBtn}
              >
                수정
              </Link>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className={styles.deleteBtn}
                title={deleting ? "삭제 중..." : "삭제"}
              >
                삭제
              </button>
            </div>
          </div>

          <div className={styles.metaTop}>
            <div>
              <div className={styles.metaValue}>서울시 {region || "-"}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>데이트 예정 일시</div>
              <div className={styles.metaValue}>{when}</div>
            </div>
          </div>

          {/* 상단 토글(지도는 그대로, 선택된 한 구간만 표시) */}
          <div style={{ margin: "12px 0 4px", display: "flex", gap: 8 }}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setRouteMode("pt")}
              aria-pressed={routeMode === "pt"}
              title="대중교통 경로만 표시"
            >
              <FaBus style={{ verticalAlign: "text-bottom" }} /> 대중교통
            </button>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setRouteMode("car")}
              aria-pressed={routeMode === "car"}
              title="자동차 경로만 표시"
            >
              <FaCar style={{ verticalAlign: "text-bottom" }} /> 자동차
            </button>
          </div>

          <h2 className={styles.sectionH2}>코스 상세 정보</h2>
          <ol className={styles.timeline}>
            {steps.map((p, idx) => {
              const isLast = idx === steps.length - 1;
              const next = steps[idx + 1];
              const mins = next ? minutesBetween(p, next) : null;

              const active = selectedLeg === idx; // 현재 선택된 구간인지

              return (
                <li key={p.placeId ?? p.id ?? idx} className={styles.step}>
                  <div className={styles.leftRail}>
                    <span className={styles.orderDot}>{idx + 1}</span>

                    {/* 전역 모드에 맞춰 한 아이콘만 노출, 클릭 시 그 구간만 선택 */}
                    {!isLast && (
                      <div
                        className={styles.transportBlock}
                        style={{ gap: 6, display: "flex", alignItems: "center" }}
                      >
                        {routeMode === "pt" ? (
                          <FaBus
                            className={styles.busIcon}
                            onClick={() => onClickLegBus(idx)}
                            title={
                              ptLoading[idx]
                                ? "대중교통 경로 불러오는 중..."
                                : active
                                ? "대중교통 경로 숨기기"
                                : "대중교통 경로 보기"
                            }
                            style={{
                              cursor: "pointer",
                              opacity: ptLoading[idx] ? 0.5 : 1,
                              filter: active ? "none" : "grayscale(40%)",
                            }}
                          />
                        ) : (
                          <FaCar
                            className={styles.busIcon}
                            onClick={() => onClickLegCar(idx)}
                            title={
                              carLoading[idx]
                                ? "자동차 경로 불러오는 중..."
                                : active
                                ? "자동차 경로 숨기기"
                                : "자동차 경로 보기"
                            }
                            style={{
                              cursor: "pointer",
                              opacity: carLoading[idx] ? 0.5 : 1,
                              filter: active ? "none" : "grayscale(40%)",
                            }}
                          />
                        )}
                      </div>
                    )}

                    {isLast && <span className={styles.endDot} />}
                  </div>

                  <div className={styles.stepBody}>
                    <div className={styles.badgeRow}>
                      <span className={styles.catBadge}>{p.category || "장소"}</span>
                      {!isLast && mins != null && (
                        <>
                          <span className={styles.sep}>·</span>
                          <span className={styles.move}>다음까지 약 {mins}분</span>
                        </>
                      )}
                    </div>

                    <div className={styles.placeName}>{p.name}</div>
                    {p.address && <div className={styles.placeAddr}>{p.address}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* 우측: 지도 (DOM 유지, 재초기화 없음) */}
        <section className={styles.mapArea}>
          <div className={styles.mapBox}>
            <div
              ref={mapRef}
              style={{ width: "100%", height: "100%", borderRadius: 8 }}
              aria-label="카카오 지도"
            />
          </div>
        </section>
      </div>
    </div>
  );
}