// src/components/Review/ReviewSidebar.jsx
import "./style.css";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";

const ReviewSidebar = ({ review, course }) => {
  const navigate = useNavigate();

  // 🔒 map 대상은 무조건 배열로 보장
  const steps = useMemo(() => {
    return Array.isArray(course)
      ? course
      : Array.isArray(course?.steps)
      ? course.steps
      : [];
  }, [course]);

  // ✅ step 객체에서 place 정보를 정규화
  const normalizePlace = useCallback(
    (c) => {
      if (!c) return null;
      const src = c.place ?? c;

      const name =
        src.name || src.title || src.placeName || c.name || c.title || "장소";
      const lat = Number(src.lat ?? src.y ?? c.lat ?? c.y);
      const lng = Number(src.lng ?? src.x ?? c.lng ?? c.x);

      return {
        id: src.id ?? src.placeId ?? c.id ?? `p-${Date.now()}`,
        name,
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        address:
          src.address || src.roadAddress || src.addr || src.address_name || "",
        category: src.category || src.type || (review?.categories?.[0] ?? ""),
        stay: src.stay || src.duration || 60,
      };
    },
    [review?.categories]
  );

  // ✅ 프리필 공통 만들기
  const buildPrefill = useCallback(
    (placeObj) => {
      const keyword =
        review?.categories?.[0] ||
        (typeof review?.keyword === "string"
          ? review.keyword.replace(/^#\s*/, "").split("·")[0]?.trim()
          : "") ||
        placeObj?.category ||
        "카페"; // 기본값

      return { keyword, place: placeObj || null };
    },
    [review]
  );

  // ✅ 이동 함수
  const goEditWithPrefill = useCallback(
    (prefill) => {
      const rid = review?.id ?? steps?.[0]?.reviewId ?? "";
      navigate(`/reviews/${rid}/edit?step=location`, { state: { prefill } });
    },
    [navigate, review?.id, steps]
  );

  // “내 코스에 추가” → 첫 장소로 프리필
  const handleAddFirst = useCallback(() => {
    const first = steps[0] ? normalizePlace(steps[0]) : null;
    const prefill = buildPrefill(first);
    goEditWithPrefill(prefill);
  }, [steps, normalizePlace, buildPrefill, goEditWithPrefill]);

  return (
    <div className="review-sidebar-box">
      {/* 작성자 프로필 */}
      <div className="writer-profile">
        <img
          src="/images/test/bluescreen.jpg"
          alt="작성자 프로필"
          className="profile-image"
        />
        <div className="writer-text">
          <p className="writer-name">{review?.authorName || "user"} 님</p>
          <p className="writer-meta">
            {review?.authorBio || "해시태그? 또는 설명"}
          </p>
        </div>
      </div>

      {/* 데이트 코스 요약 */}
      <div className="course-order-section">
        <div className="section-header">
          <h2>데이트 코스 순서</h2>
          <button
            type="button"
            className="see-all-link"
            // 필요 시 전체 보기 라우팅/모달 연결
            onClick={handleAddFirst}
            title="이 순서로 수정하기"
          >
            모두 보기
          </button>
        </div>

        <ol className="course-list">
          {steps.map((c, i) => {
            const place = c?.place || c?.name || c?.title || "-";
            const category = c?.category || c?.type || "";
            const time = c?.time || c?.visitedTime || "";

            return (
              <li
                className="course-item"
                key={c?.id || c?.placeId || i}
                onClick={() =>
                  goEditWithPrefill(buildPrefill(normalizePlace(c)))
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    goEditWithPrefill(buildPrefill(normalizePlace(c)));
                  }
                }}
                title="이 장소로 수정하기"
              >
                <div className="step-indicator">{i + 1}</div>
                <div className="course-content">
                  <div className="course-main">
                    <span className="course-place">{place.name || place}</span>
                    {category && (
                      <span className="course-category">{category}</span>
                    )}
                  </div>
                  {time ? (
                    <div className="course-sub">
                      <span className="course-time">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="clock-icon"
                        />{" "}
                        {time}
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

      <button className="add-course-button" onClick={handleAddFirst}>
        내 코스에 추가
      </button>
    </div>
  );
};

export default ReviewSidebar;
