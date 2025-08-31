// src/pages/CourseDetailPage/index.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styles from "./CourseDetailPage.module.css";
import Header from "../../components/Header";
import { FaBus } from "react-icons/fa";
import api from "../../api/api";

/* global kakao */

// 날짜/시간 포맷터 -> "YYYY-MM-DD HH:mm"
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

// 주소에서 "중구" 처럼 구 이름만 추출
const extractDistrict = (address) => {
  if (!address) return "";
  const parts = String(address).trim().split(/\s+/);
  return parts[1] || "";
};

// 좌표 사이 대략적인 도보/직선거리 시간(분)
const minutesBetween = (a, b) => {
  if (!a || !b) return null;
  const lat1 = Number(a.lat), lng1 = Number(a.lng);
  const lat2 = Number(b.lat), lng2 = Number(b.lng);
  if ([lat1, lng1, lat2, lng2].some((n) => !Number.isFinite(n))) return null;

  const R = 6371; // km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const distKm = 2 * R * Math.asin(Math.sqrt(s));
  const walkingKmPerMin = 4 / 60; // 시속 4km
  return Math.round(distKm / walkingKmPerMin);
};

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // 서버 데이터
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [deleting, setDeleting] = useState(false);

  // 지도 refs
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef = useRef([]);

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

  // 지도 표시/마커
  useEffect(() => {
    const places = course?.places || [];
    if (!window.kakao?.maps || !mapRef.current || places.length === 0) return;

    const first = places[0];
    const center = new kakao.maps.LatLng(Number(first.lat), Number(first.lng));
    const map =
      mapObjRef.current ||
      new kakao.maps.Map(mapRef.current, { center, level: 5 });
    mapObjRef.current = map;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 마커 + bounds
    const bounds = new kakao.maps.LatLngBounds();
    places.forEach((p) => {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const pos = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ map, position: pos });
      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (!bounds.isEmpty()) map.setBounds(bounds);
  }, [course]);

  // 지역구
  const region = useMemo(() => {
    const addr = course?.places?.[0]?.address;
    return extractDistrict(addr) || "코스";
  }, [course]);

  // 삭제 핸들러
  const onDelete = async () => {
    if (deleting) return;
    if (!window.confirm("이 코스를 삭제할까요? 복구할 수 없습니다.")) return;

    try {
      setDeleting(true);
      await api.delete(`/courses/${courseId}`);
      alert("코스를 삭제했습니다.");
      // 코스 탭으로 이동
      navigate("/mypage?tab=courses", { replace: true });
      // 또는 state 사용 시:
      // navigate("/mypage", { replace: true, state: { initialTab: "courses" } });
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

          <h2 className={styles.sectionH2}>코스 상세 정보</h2>

          <ol className={styles.timeline}>
            {steps.map((p, idx) => {
              const isLast = idx === steps.length - 1;
              const next = steps[idx + 1];
              const mins = next ? minutesBetween(p, next) : null;

              return (
                <li key={p.placeId ?? p.id ?? idx} className={styles.step}>
                  <div className={styles.leftRail}>
                    <span className={styles.orderDot}>{idx + 1}</span>
                    {!isLast && (
                      <div className={styles.transportBlock}>
                        <FaBus className={styles.busIcon} />
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
                          <button type="button" className={styles.linkBtn}>
                            이동수단 변경
                          </button>
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

        {/* 우측: 지도 */}
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
