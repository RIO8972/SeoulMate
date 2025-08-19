import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./CourseDetailPage.module.css";
import Header from "../../components/Header";
import { FaBus } from "react-icons/fa";
/* global kakao */

export default function CourseDetailPage() {
  // ✅ URL 파라미터에서 courseId 가져오기
  const { courseId } = useParams();

  // 데모용 코스 데이터 (실사용 시 courseId로 API 호출해서 가져오면 됨)
  const course = {
    region: "종로구",
    title: "종로구 데이트 코스",
    date: "2025-06-10",
    steps: [
      {
        id: 1,
        order: 1,
        category: "명소",
        name: "종묘",
        stay: "60분",
        toNext: "15분",
      },
      {
        id: 2,
        order: 2,
        category: "쇼핑",
        name: "동대문 디지털 플라자",
        stay: "90분",
        toNext: "20분",
      },
      {
        id: 3,
        order: 3,
        category: "음악",
        name: "국립극장",
        stay: "50분",
        toNext: null,
      }, // 마지막
    ],
  };

  // ── Kakao 지도 (DistrictMap 패턴 그대로) ──────────────────────────────
  const mapRef = useRef(null); // 지도 컨테이너 DOM
  const mapObjRef = useRef(null); // kakao.maps.Map
  const markerRef = useRef(null); // 중심 마커
  const geocoderRef = useRef(null); // 지오코더
  const [addr, setAddr] = useState(""); // 주소 입력 상태

  // 지도 초기화
  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current) return;

    // 초기 중심: 서울시청
    const center = new kakao.maps.LatLng(37.5665, 126.978);
    const map = new kakao.maps.Map(mapRef.current, { center, level: 5 });
    mapObjRef.current = map;

    // 중심 마커
    markerRef.current = new kakao.maps.Marker({ map, position: center });

    // 지오코더 준비 (kakao.maps.services 스크립트 포함되어 있어야 함)
    geocoderRef.current = new kakao.maps.services.Geocoder();

    // 컨테이너 리사이즈 대응
    const ro = new ResizeObserver(() =>
      kakao.maps.event.trigger(map, "resize")
    );
    ro.observe(mapRef.current);

    return () => ro.disconnect();
  }, []);

  // 주소 검색 → 지오코딩 → 지도/마커 이동
  const handleSearch = () => {
    const q = addr.trim();
    if (!q || !geocoderRef.current || !mapObjRef.current) return;

    geocoderRef.current.addressSearch(q, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || !result?.length) return;
      const { x, y } = result[0]; // x=lng, y=lat
      const ll = new kakao.maps.LatLng(Number(y), Number(x));

      mapObjRef.current.setLevel(5);
      mapObjRef.current.panTo(ll);

      if (markerRef.current) {
        markerRef.current.setPosition(ll);
      } else {
        markerRef.current = new kakao.maps.Marker({
          map: mapObjRef.current,
          position: ll,
        });
      }
    });
  };
  // ────────────────────────────────────────────────────────────────────

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

          <h1 className={styles.title}>{course.region} 데이트 코스</h1>

          <div className={styles.actions}>
            {/* ✅ courseId가 있을 때만 수정 버튼 노출 (없으면 링크 깨짐 방지) */}
            {courseId && (
              <Link
                to={`/courses/${courseId}/edit`}
                state={{ course }} // ✅ 현재 코스 데이터 함께 전달
                className={styles.editBtn}
              >
                수정
              </Link>
            )}
          </div>

          <div className={styles.metaTop}>
            <div>
              <div className={styles.metaLabel}>데이트 코스 제목</div>
              <div className={styles.metaValue}>{course.title}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>데이트 예정 날짜</div>
              <div className={styles.metaValue}>{course.date}</div>
            </div>
          </div>

          <h2 className={styles.sectionH2}>코스 상세 정보</h2>

          {/* 타임라인 */}
          <ol className={styles.timeline}>
            {course.steps.map((s, idx) => {
              const isLast = idx === course.steps.length - 1;
              return (
                <li key={s.id} className={styles.step}>
                  {/* 왼쪽: 번호 원 + 세로 라인 */}
                  <div className={styles.leftRail}>
                    <span className={styles.orderDot}>{s.order}</span>
                    {!isLast && (
                      <div className={styles.transportBlock}>
                        <FaBus className={styles.busIcon} />
                      </div>
                    )}
                    {isLast && <span className={styles.endDot} />}
                  </div>

                  {/* 오른쪽: 내용 */}
                  <div className={styles.stepBody}>
                    <div className={styles.badgeRow}>
                      <span className={styles.catBadge}>{s.category}</span>
                      {!isLast && (
                        <>
                          <span className={styles.sep}>·</span>
                          <span className={styles.move}>
                            다음 장소까지: {s.toNext}
                          </span>
                          <button type="button" className={styles.linkBtn}>
                            이동수단 변경
                          </button>
                        </>
                      )}
                    </div>

                    <div className={styles.placeName}>{s.name}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* 우측: 검색 + 카카오 지도 */}
        <section className={styles.mapArea}>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              placeholder="주소를 입력하세요"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button
              className={styles.searchBtn}
              type="button"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>

          <div className={styles.mapBox}>
            {/* DistrictMap과 같은 방식: ref로 직접 지도 붙임 */}
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
