import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styles from "./CourseDetailPage.module.css";
import Header from "../../components/Header";
import { FaBus, FaCar, FaWalking } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import api from "../../api/api";

/* global kakao */

// ───────── 유틸 ─────────
const formatDateTime = (v) => {
  if (!v) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  const onlyDateStr = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = v instanceof Date ? v : new Date(onlyDateStr ? `${v}T00:00:00` : v);
  if (Number.isNaN(+d)) return String(v).replace("T", " ").slice(0, 16);
  const yyyy = d.getFullYear(),
    mm = pad(d.getMonth() + 1),
    dd = pad(d.getDate());
  if (onlyDateStr) return `${yyyy}-${mm}-${dd}`;
  const HH = pad(d.getHours()),
    MM = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
};
const extractDistrict = (address) => {
  if (!address) return "";
  const parts = String(address).trim().split(/\s+/);
  return parts[1] || "";
};
const haversineMeters = (A, B) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(B.lat - A.lat);
  const dLng = toRad(B.lng - A.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(A.lat)) * Math.cos(toRad(B.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// ───────── 팝업 ─────────
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

// ───────── 메인 컴포넌트 ─────────
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

  // 구간별 라인 저장
  const ptLinesByLegRef = useRef({});
  const carLinesByLegRef = useRef({});
  const walkLinesByLegRef = useRef({});

  // 메타
  const ptMetaByLegRef = useRef({});
  const carMetaByLegRef = useRef({});
  const walkMetaByLegRef = useRef({});
  const [metaVersion, setMetaVersion] = useState(0);

  const overlayRef = useRef(null);

  // 로딩 플래그(아이콘 페이드용)
  const [ptLoading, setPtLoading] = useState({});
  const [carLoading, setCarLoading] = useState({});
  const [walkLoading, setWalkLoading] = useState({});

  // 상단 탭: null | 'pt' | 'car' | 'walk'
  const [routeMode, setRouteMode] = useState(null);
  // 현재 선택된 구간
  const [selectedLeg, setSelectedLeg] = useState(null);

  // 코스 로딩
  useEffect(() => {
    (async () => {
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
    })();
  }, [courseId]);

  // 지도 초기화 + 마커
  useEffect(() => {
    const places = course?.places || [];
    if (!window.kakao?.maps || !mapRef.current || places.length === 0) return;

    const first = places[0];
    const center = new kakao.maps.LatLng(Number(first.lat), Number(first.lng));
    const map =
      mapObjRef.current ||
      new kakao.maps.Map(mapRef.current, { center, level: 5 });
    mapObjRef.current = map;

    // 정리
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    [ptLinesByLegRef, carLinesByLegRef, walkLinesByLegRef].forEach((ref) => {
      Object.values(ref.current).forEach((arr) =>
        (arr || []).forEach((pl) => pl.setMap(null))
      );
      ref.current = {};
    });
    ptMetaByLegRef.current = {};
    carMetaByLegRef.current = {};
    walkMetaByLegRef.current = {};
    setMetaVersion((v) => v + 1);

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    setPtLoading({});
    setCarLoading({});
    setWalkLoading({});
    setSelectedLeg(null);

    // 마커 + bounds
    const bounds = new kakao.maps.LatLngBounds();
    places.forEach((p) => {
      const lat = Number(p.lat),
        lng = Number(p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const pos = new kakao.maps.LatLng(lat, lng);
      bounds.extend(pos);
      const marker = new kakao.maps.Marker({
        map,
        position: pos,
        title: p.name,
      });
      markersRef.current.push(marker);
    });
    if (!bounds.isEmpty()) map.setBounds(bounds);
  }, [course]);

  // 라인 숨기기
  const hideAllLines = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    [ptLinesByLegRef, carLinesByLegRef, walkLinesByLegRef].forEach((ref) => {
      Object.values(ref.current).forEach((arr) =>
        (arr || []).forEach((pl) => pl.setMap(null))
      );
    });
  }, []);

  // 한 구간만 표시
  const showOnlyLeg = useCallback(
    (kind, legIdx) => {
      const map = mapObjRef.current;
      if (!map) return;
      hideAllLines();
      const dict =
        kind === "pt"
          ? ptLinesByLegRef.current
          : kind === "car"
          ? carLinesByLegRef.current
          : walkLinesByLegRef.current;
      (dict[legIdx] || []).forEach((pl) => pl.setMap(map));
    },
    [hideAllLines]
  );

  // 구간 보이기(필요 시 생성)
  const ensureLegVisible = useCallback(
    async (kind, idx) => {
      if (!kind && kind !== 0) return;
      const map = mapObjRef.current;
      if (!map) return;
      const places = course?.places || [];
      const a = places[idx],
        b = places[idx + 1];
      if (!a || !b) return;

      if (kind === "pt") {
        if (!ptLinesByLegRef.current[idx]?.length) {
          await drawPublicRouteLeg(
            { lat: +a.lat, lng: +a.lng },
            { lat: +b.lat, lng: +b.lng },
            idx
          );
        }
      } else if (kind === "car") {
        if (!carLinesByLegRef.current[idx]?.length) {
          await drawCarRouteLeg(
            { lat: +a.lat, lng: +a.lng },
            { lat: +b.lat, lng: +b.lng },
            idx
          );
        }
      } else if (kind === "walk") {
        if (!walkLinesByLegRef.current[idx]?.length) {
          await drawWalkLeg(
            { lat: +a.lat, lng: +a.lng },
            { lat: +b.lat, lng: +b.lng },
            idx
          );
        }
      }
      setSelectedLeg(idx);
      showOnlyLeg(kind, idx);
    },
    [course, showOnlyLeg]
  );

  // 모드 바뀌면
  useEffect(() => {
    if (!routeMode) {
      hideAllLines();
      setSelectedLeg(null);
      return;
    }
    const legs = (course?.places?.length || 0) - 1;
    if (legs <= 0) return;
    ensureLegVisible(routeMode, 0); // 자동으로 1→2 선택
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeMode]);

  // 클릭 핸들러
  const onClickLeg = useCallback(
    async (idx) => {
      if (!routeMode) return; // 모드 선택 전에는 동작 X
      await ensureLegVisible(routeMode, idx);
    },
    [routeMode, ensureLegVisible]
  );

  // ───── 라인 생성 (대중교통) ─────
  const drawPublicRouteLeg = useCallback(async (A, B, legIdx) => {
    const map = mapObjRef.current;
    if (!map) return { status: "noop" };

    try {
      const url1 =
        `https://seoul-mate.co.kr/cityapi/search/route?mode=public-transport` +
        `&start_x=${A.lng}&start_y=${A.lat}&end_x=${B.lng}&end_y=${B.lat}`;
      const res1 = await fetch(url1);
      const j1 = await res1.json();

      const paths = j1?.result?.path || j1?.result?.paths || [];
      if (!paths.length) {
        ptMetaByLegRef.current[legIdx] = { error: "noPT" };
        setMetaVersion((v) => v + 1);
        return { status: "noPT" };
      }
      const firstPath = paths.find((p) => p.pathType === 1) || paths[0];

      const segMetas = (firstPath?.subPath || [])
        .filter((sp) => sp.trafficType === 1 || sp.trafficType === 2)
        .map((sp) => {
          const isSubway = sp.trafficType === 1;
          const lane0 = Array.isArray(sp.lane) ? sp.lane[0] : null;
          return {
            kind: isSubway ? "subway" : "bus",
            name: isSubway ? lane0?.name : lane0?.busNo,
            startName: sp.startName,
            endName: sp.endName,
            stationCount: sp.stationCount,
            sectionTime: sp.sectionTime,
            passStations:
              sp?.passStopList?.stations?.map((s) => s.stationName) || [],
          };
        });

      const mapObj =
        firstPath?.info?.mapObj ||
        firstPath?.info?.mapOBJ ||
        firstPath?.info?.map_object;
      if (!mapObj) {
        ptMetaByLegRef.current[legIdx] = { error: "noPT" };
        setMetaVersion((v) => v + 1);
        return { status: "noPT" };
      }

      const url2 = `https://seoul-mate.co.kr/cityapi/search/route/lane?mapObj=${encodeURIComponent(
        mapObj
      )}`;
      const res2 = await fetch(url2);
      const j2 = await res2.json();

      const lanes = j2?.result?.lane || [];
      if (!lanes.length) {
        ptMetaByLegRef.current[legIdx] = { error: "noPT" };
        setMetaVersion((v) => v + 1);
        return { status: "noPT" };
      }

      const pickColor = (t) =>
        t === 1
          ? "#0032A0"
          : t === 2
          ? "#00B140"
          : t === 3
          ? "#FC4C02"
          : t === 4
          ? "#00A9E0"
          : t === 5
          ? "#A05EB5"
          : t === 6
          ? "#A9431E"
          : t === 7
          ? "#67823A"
          : t === 8
          ? "#E31C79"
          : t === 9
          ? "#8C8279"
          : "#808080";

      const created = [];
      let segIdx = 0;

      lanes.forEach((lane) => {
        const color = pickColor(lane.type);
        (lane.section || []).forEach((section) => {
          const graph = section.graphPos || [];
          if (!graph.length) return;
          const path = graph.map((pos) => new kakao.maps.LatLng(pos.y, pos.x));
          const meta = segMetas[segIdx] || null;

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
                {
                  label: meta.kind === "subway" ? "노선" : "버스",
                  value: meta.name || "-",
                },
                { label: "출발", value: meta.startName || "-" },
                { label: "도착", value: meta.endName || "-" },
                { label: "정거장", value: String(meta.stationCount ?? "-") },
                { label: "소요", value: `${meta.sectionTime ?? "-"} 분` }
              );
              if (meta.passStations?.length)
                rows.push({
                  label: "정차",
                  value: meta.passStations.join(" → "),
                });
            }
            const title =
              meta?.kind === "subway"
                ? `${meta.name || "지하철"} 구간`
                : meta?.kind === "bus"
                ? `버스 ${meta.name || ""} 구간`
                : "대중교통";
            const box = buildPopupBox(title, rows);
            openOverlay(map, overlayRef, e.latLng, box);
          });

          created.push(colorLine, hitLine);
        });
        segIdx += 1;
      });

      ptLinesByLegRef.current[legIdx] = created;
      const totalTime =
        firstPath?.info?.totalTime ??
        segMetas.reduce((s, it) => s + (it.sectionTime || 0), 0);
      ptMetaByLegRef.current[legIdx] = { totalTime, segs: segMetas };
      setMetaVersion((v) => v + 1);
      return { status: "ok" };
    } catch (e) {
      console.warn("[PT] error:", e);
      ptMetaByLegRef.current[legIdx] = { error: "noPT" };
      setMetaVersion((v) => v + 1);
      return { status: "noPT" };
    }
  }, []);

  // ───── 자동차 ─────
  const drawCarRouteLeg = useCallback(async (A, B, legIdx) => {
    const map = mapObjRef.current;
    if (!map) return;

    const url =
      `https://seoul-mate.co.kr/cityapi/search/route?mode=car` +
      `&start_x=${A.lng}&start_y=${A.lat}&end_x=${B.lng}&end_y=${B.lat}`;
    const res = await fetch(url);
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
            const x = v[i],
              y = v[i + 1];
            if (Number.isFinite(x) && Number.isFinite(y))
              path.push(new kakao.maps.LatLng(y, x));
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
            const rows = [
              {
                label: "거리",
                value: `${(road.distance ?? 0).toLocaleString()} m`,
              },
              {
                label: "예상",
                value: `${Math.round((road.duration ?? 0) / 60)} 분`,
              },
            ];
            if (road.traffic_speed != null)
              rows.push({ label: "속도", value: `${road.traffic_speed} km/h` });
            const box = buildPopupBox(
              road.name?.trim() || "이름 없는 도로",
              rows
            );
            openOverlay(map, overlayRef, e.latLng, box);
          });

          created.push(colorLine, hitLine);
        });
      });
    } else if (json?.route?.traoptimal?.[0]?.path?.length) {
      const path = json.route.traoptimal[0].path.map(
        ([x, y]) => new kakao.maps.LatLng(y, x)
      );

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
        if (totalDist != null)
          rows.push({
            label: "총 거리",
            value: `${totalDist.toLocaleString()} m`,
          });
        if (totalDur != null)
          rows.push({
            label: "총 시간",
            value: `${Math.round(totalDur / 60)} 분`,
          });
        const box = buildPopupBox("자동차 경로", rows);
        openOverlay(map, overlayRef, e.latLng, box);
      });

      created.push(colorLine, hitLine);
    }

    carLinesByLegRef.current[legIdx] = [
      ...(carLinesByLegRef.current[legIdx] || []),
      ...created,
    ];
    const totalDist = json?.routes?.[0]?.summary?.distance ?? null;
    const totalDur = json?.routes?.[0]?.summary?.duration ?? null;
    carMetaByLegRef.current[legIdx] = {
      distance: totalDist,
      duration: totalDur,
    };
    setMetaVersion((v) => v + 1);
  }, []);

  // ───── 도보(직선) ─────
  const drawWalkLeg = useCallback(async (A, B, legIdx) => {
    const map = mapObjRef.current;
    if (!map) return false;
    const path = [
      new kakao.maps.LatLng(A.lat, A.lng),
      new kakao.maps.LatLng(B.lat, B.lng),
    ];
    const line = new kakao.maps.Polyline({
      map: null,
      path,
      strokeWeight: 4,
      strokeColor: "#111827",
      strokeOpacity: 0.95,
      strokeStyle: "shortdash",
      zIndex: 3,
      clickable: true,
    });
    kakao.maps.event.addListener(line, "mouseover", () => {
      map.setDraggable(false);
      setMapCursor(map, "pointer");
    });
    kakao.maps.event.addListener(line, "mouseout", () => {
      map.setDraggable(true);
      setMapCursor(map, "");
    });
    kakao.maps.event.addListener(line, "click", (e) => {
      const distM = haversineMeters(A, B);
      const mins = Math.max(1, Math.round(distM / 1.2 / 60));
      const rows = [
        { label: "거리", value: `${Math.round(distM).toLocaleString()} m` },
        { label: "예상", value: `${mins} 분` },
      ];
      const box = buildPopupBox("도보 이동", rows);
      openOverlay(map, overlayRef, e.latLng, box);
    });
    walkLinesByLegRef.current[legIdx] = [line];

    const distM = haversineMeters(A, B);
    walkMetaByLegRef.current[legIdx] = {
      distance: distM,
      minutes: Math.max(1, Math.round(distM / 1.2 / 60)),
    };
    setMetaVersion((v) => v + 1);
    return true;
  }, []);

  // 지역구
  const region = useMemo(() => {
    const addr = course?.places?.[0]?.address;
    return extractDistrict(addr) || "코스";
  }, [course]);

  // 삭제
  const onDelete = async () => {
    if (deleting) return;
    if (!window.confirm("이 코스를 삭제할까요? 복구할 수 없습니다.")) return;
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

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.inner}>불러오는 중…</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.inner} style={{ color: "#d33" }}>
          {err}
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.inner}>코스를 찾을 수 없습니다.</div>
      </div>
    );
  }

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
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                <FiEdit2 /> 수정
              </Link>

              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className={`${styles.btn} ${styles.btnDanger}`}
                aria-busy={deleting ? "true" : "false"}
                title={deleting ? "삭제 중..." : "삭제"}
              >
                <FiTrash2 />
                {deleting ? "삭제 중…" : "삭제"}
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

          <h2 className={styles.sectionH2}>코스 상세 정보</h2>
          <ol className={styles.timeline}>
            {steps.map((p, idx) => {
              const isLast = idx === steps.length - 1;
              const active = selectedLeg === idx;

              return (
                <li
                  key={p.placeId ?? p.id ?? idx}
                  className={`${styles.step} ${styles.stepClickable} ${
                    active ? styles.stepActive : ""
                  }`}
                  onClick={!isLast ? () => onClickLeg(idx) : undefined}
                >
                  <div
                    className={`${styles.leftRail} ${
                      !routeMode ? styles.noTransport : ""
                    }`}
                  >
                    <span className={styles.orderDot}>{idx + 1}</span>

                    {/* 모드 선택 전엔 아이콘 없음 */}
                    {!isLast && routeMode && (
                      <div className={styles.transportBlock}>
                        {routeMode === "pt" ? (
                          <FaBus
                            className={styles.busIcon}
                            style={{ opacity: ptLoading[idx] ? 0.5 : 1 }}
                            title="대중교통"
                          />
                        ) : routeMode === "car" ? (
                          <FaCar
                            className={styles.busIcon}
                            style={{ opacity: carLoading[idx] ? 0.5 : 1 }}
                            title="자동차"
                          />
                        ) : (
                          <FaWalking
                            className={styles.busIcon}
                            style={{ opacity: walkLoading[idx] ? 0.5 : 1 }}
                            title="도보"
                          />
                        )}
                      </div>
                    )}

                    {isLast && <span className={styles.endDot} />}
                  </div>

                  <div className={styles.stepBody}>
                    <div className={styles.badgeRow}>
                      <span className={styles.catBadge}>
                        {p.category || "장소"}
                      </span>
                    </div>
                    <div className={styles.placeName}>{p.name}</div>
                    {p.address && (
                      <div className={styles.placeAddr}>{p.address}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* 우측: 지도 + 컨트롤 */}
        <section className={styles.mapArea}>
          <div className={styles.mapBox}>
            <div className={styles.mapControls}>
              {/* 이동수단 탭 */}
              <div className={styles.modeBtns}>
                <button
                  type="button"
                  className={`${styles.tab} ${
                    routeMode === "pt" ? styles.tabActive : ""
                  }`}
                  onClick={() => setRouteMode("pt")}
                  aria-pressed={routeMode === "pt"}
                  title="대중교통"
                >
                  <FaBus /> 대중교통
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${
                    routeMode === "car" ? styles.tabActive : ""
                  }`}
                  onClick={() => setRouteMode("car")}
                  aria-pressed={routeMode === "car"}
                  title="자동차"
                >
                  <FaCar /> 자동차
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${
                    routeMode === "walk" ? styles.tabActive : ""
                  }`}
                  onClick={() => setRouteMode("walk")}
                  aria-pressed={routeMode === "walk"}
                  title="도보"
                >
                  <FaWalking /> 도보
                </button>
              </div>

              {/* 구간 칩 (모드 선택 전에는 비활성화) */}
              <LegChips
                steps={steps}
                active={selectedLeg ?? -1}
                disabled={!routeMode}
                onSelect={(i) => onClickLeg(i)}
              />

              {/* 정보 카드: 모드 미선택 시에만 안내 문구 */}
              <div className={styles.infoCard}>
                {!routeMode ? (
                  <EmptyHint />
                ) : (
                  <MapLegInfo
                    key={`${routeMode}-${selectedLeg}-${metaVersion}`}
                    mode={routeMode}
                    legIndex={selectedLeg ?? 0}
                    steps={steps}
                    ptMeta={ptMetaByLegRef.current[selectedLeg ?? 0]}
                    carMeta={carMetaByLegRef.current[selectedLeg ?? 0]}
                    walkMeta={walkMetaByLegRef.current[selectedLeg ?? 0]}
                  />
                )}
              </div>
            </div>

            {/* 카카오 지도 */}
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

/* ───────── 보조 컴포넌트 ───────── */

function LegChips({ steps, active, disabled, onSelect }) {
  const legs = Math.max(0, (steps?.length || 0) - 1);
  if (!legs) return null;
  return (
    <div className={styles.legChips}>
      {Array.from({ length: legs }).map((_, i) => (
        <button
          key={i}
          className={`${styles.chip} ${active === i ? styles.chipActive : ""} ${
            disabled ? styles.chipDisabled : ""
          }`}
          onClick={() => onSelect(i)}
          type="button"
          title={`${i + 1} → ${i + 2}`}
        >
          <span className={styles.chipBadge}>{i + 1}</span>
          <span className={styles.chipArrow}>→</span>
          <span className={styles.chipBadge}>{i + 2}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className={`${styles.infoCard} ${styles.infoEmpty}`}>
      <div className={styles.infoHeaderLine}>
        <span className={styles.infoIcon} aria-hidden />
        <span className={styles.infoLead}>이동 방법을 선택하세요</span>
      </div>
      <p className={styles.infoText}>
        상단 탭에서 <strong>대중교통</strong> / <strong>자동차</strong> /{" "}
        <strong>도보</strong> 중 하나를 선택하면, 첫 구간이 자동으로 표시됩니다.
      </p>
    </div>
  );
}

function MapLegInfo({ mode, legIndex, steps, ptMeta, carMeta, walkMeta }) {
  const a = steps[legIndex],
    b = steps[legIndex + 1];
  const title = a && b ? `${a.name} → ${b.name}` : "-";
  const fmtM = (m) => (m == null ? "-" : `${Math.round(m).toLocaleString()} m`);
  const fmtMin = (x) => (x == null ? "-" : `${Math.round(x)} 분`);

  if (mode === "walk") {
    return (
      <>
        <div className={styles.infoHeader}>
          <span className={`${styles.kicker} ${styles.kicker_walk}`}>도보</span>
        </div>
        <div className={styles.infoTitle}>{title}</div>
        <div className={styles.divider} />
        <div className={styles.infoRows}>
          <div className={styles.infoLabel}>거리</div>
          <div className={styles.infoValue}>{fmtM(walkMeta?.distance)}</div>
          <div className={styles.infoLabel}>예상</div>
          <div className={styles.infoValue}>{fmtMin(walkMeta?.minutes)}</div>
        </div>
      </>
    );
  }

  if (mode === "car") {
    const m = carMeta?.duration != null ? carMeta.duration / 60 : null;
    return (
      <>
        <div className={styles.infoHeader}>
          <span className={`${styles.kicker} ${styles.kicker_car}`}>
            자동차
          </span>
        </div>
        <div className={styles.infoTitle}>{title}</div>
        <div className={styles.divider} />
        <div className={styles.infoRows}>
          <div className={styles.infoLabel}>거리</div>
          <div className={styles.infoValue}>{fmtM(carMeta?.distance)}</div>
          <div className={styles.infoLabel}>예상</div>
          <div className={styles.infoValue}>{fmtMin(m)}</div>
        </div>
      </>
    );
  }

  // PT
  const noPT =
    ptMeta?.error || (!ptMeta?.segs?.length && ptMeta?.totalTime == null);
  if (noPT) {
    return (
      <>
        <div className={styles.infoHeader}>
          <span className={styles.kicker}>대중교통</span>
        </div>
        <div className={styles.infoTitle}>{title}</div>
        <div className={styles.divider} />
        <div className={styles.infoNote}>
          <p>해당 구간은 대중교통 안내가 제공되지 않아요.</p>
          <p>
            상단의 <strong>도보</strong> 또는 <strong>자동차</strong> 탭으로
            전환해 이동 경로를 확인해 보세요.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.infoHeader}>
        <span className={styles.kicker}>대중교통</span>
      </div>
      <div className={styles.infoTitle}>{title}</div>
      <div className={styles.divider} />
      <div className={styles.infoRows}>
        <div className={styles.infoLabel}>소요</div>
        <div className={styles.infoValue}>{fmtMin(ptMeta?.totalTime)}</div>
      </div>
      {Array.isArray(ptMeta?.segs) &&
        ptMeta.segs.map((s, i) => (
          <div className={styles.segItem} key={i}>
            <span
              className={`${styles.segBadge} ${
                s.kind === "subway" ? styles.segSubway : styles.segBus
              }`}
            >
              {s.kind === "subway" ? "지하철" : "버스"} {s.name ?? "-"}
            </span>
            <span>
              {s.startName} → {s.endName}
            </span>
            <span>{fmtMin(s.sectionTime)}</span>
          </div>
        ))}
    </>
  );
}
