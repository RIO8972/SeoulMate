// src/components/Review/ReviewSidebar.jsx
import "./style.css";
import { useCallback, useMemo } from "react";
// import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import api from "../../../api/api";

const ReviewSidebar = ({ review, course }) => {
  // course가 배열이면 그대로, steps 있으면 steps, 아니면 비움
  const steps = useMemo(() => {
    if (Array.isArray(course)) return course;
    if (Array.isArray(course?.steps)) return course.steps;
    return [];
  }, [course]);

  // place 표준화 (표시용)
  const normalizePlace = useCallback(
    (src, idx = 0) => {
      if (!src) return null;
      const lat = parseFloat(src.lat ?? src.y);
      const lng = parseFloat(src.lng ?? src.x);
      return {
        id: src.id ?? src.placeId ?? `p-${idx}`,
        name: src.name || src.title || "장소",
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        address:
          src.address || src.roadAddress || src.addr || src.address_name || "",
        category: src.category || (review?.categories?.[0] ?? ""),
        stay: src.stay || src.duration || 60,
        time: src.time || src.visitedTime || "",
      };
    },
    [review?.categories]
  );

  // 장소 담기: review.places → PlaceRequestDto[] 로 매핑 후 POST
  const handleAddAllToCart = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    const srcPlaces = Array.isArray(review?.places) ? review.places : [];
    if (srcPlaces.length === 0) {
      alert("담을 장소가 없습니다.");
      return;
    }
    const body = srcPlaces.map((p, i) => ({
      placeId: String(p.placeId ?? p.id ?? `p-${i}`),
      name: p.name ?? p.title ?? "",
      lat: String(p.lat ?? p.y ?? ""),
      lng: String(p.lng ?? p.x ?? ""),
      address:
        p.address ??
        p.road_address_name ??
        p.address_name ??
        p.roadAddress ??
        p.addr ??
        "",
      url: p.url ?? p.place_url ?? "",
    }));

    try {
      // await api.post("/carts/places", body, { headers: { "Content-Type": "application/json" } });
      await api.post("/carts/places", body); // 인터셉터로 토큰 자동 주입
      alert("장소를 관심 목록에 담았습니다.");
    } catch (e) {
      console.error("[carts/places] error:", e);
      const code = e?.response?.status;
      if (code === 401) alert("로그인이 필요합니다.");
      else alert("장소 담기 중 오류가 발생했습니다.");
    }
  }, [review?.places]);

  // 작성자 정보
  const authorName =
    review?.authorName || review?.userProfile?.username || "user";
  const authorImg =
    review?.authorImg ||
    review?.userProfile?.imgUrl ||
    "/images/test/bluescreen.jpg";

  return (
    <div className="review-sidebar-box">
      {/* 작성자 프로필 */}
      <div className="writer-profile">
        <img
          src={authorImg}
          alt="작성자 프로필"
          className="profile-image"
          onError={(e) => {
            e.currentTarget.src = "/images/test/bluescreen.jpg";
            e.currentTarget.onerror = null;
          }}
        />
        <div className="writer-text">
          <p className="writer-name">{authorName} 님</p>
          <p className="writer-meta">{review?.authorBio || ""}</p>
        </div>
      </div>

      {/* 데이트 코스 순서 (클릭시 이동 동작 제거) */}
      <div className="course-order-section">
        <div className="section-header">
          <h2>데이트 코스 순서</h2>
        </div>

        <ol className="course-list">
          {steps.map((c, i) => {
            const place = normalizePlace(c, i);
            return (
              <li className="course-item" key={place?.id || c?.placeId || i}>
                <div className="step-indicator">{i + 1}</div>
                <div className="course-content">
                  <div className="course-main">
                    <span className="course-place">{place?.name || "-"}</span>
                    {place?.category && (
                      <span className="course-category">{place.category}</span>
                    )}
                  </div>
                  {place?.time ? (
                    <div className="course-sub">
                      <span className="course-time">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="clock-icon"
                        />{" "}
                        {place.time}
                      </span>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>

        {steps.length === 0 && (
          <div className="course-empty">등록된 코스가 없습니다.</div>
        )}
      </div>

      {/* 장소 담기 → carts/places POST */}
      <button className="add-course-button" onClick={handleAddAllToCart}>
        장소 담기
      </button>
    </div>
  );
};

export default ReviewSidebar;
