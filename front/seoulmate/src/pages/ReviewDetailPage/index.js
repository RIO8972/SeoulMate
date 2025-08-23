// src/pages/ReviewDetailPage.jsx
import "./style.css";
import { useParams, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReviewLeftContent from "../../components/Review/ReviewLeftContent";
import ReviewSidebar from "../../components/Review/ReviewSidebar";

export default function ReviewDetailPage({ reviews }) {
  const { id } = useParams();
  const location = useLocation();
  const [search] = useSearchParams();

  // 편집 가능 여부: 상세로 올 때 state.canEdit === true 이거나, ?editable=1 쿼리로 허용
  const canEditFromState = location.state?.canEdit === true;
  const canEditFromQuery = search.get("editable") === "1";
  const canEdit = canEditFromState || canEditFromQuery;

  const [reviewFromApi, setReviewFromApi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // App의 임시 데이터(reviews prop)에서 우선 찾기
  const reviewFromProp = useMemo(() => {
    if (!Array.isArray(reviews)) return null;
    return reviews.find((r) => Number(r.id) === Number(id)) || null;
  }, [reviews, id]);

  // prop에 없으면 단건 API 조회
  useEffect(() => {
    if (reviewFromProp) return;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const { data } = await axios.get(`/api/reviews/${id}`);
        setReviewFromApi(data);
      } catch {
        setErr("리뷰를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, reviewFromProp]);

  const review = reviewFromProp || reviewFromApi;

  if (loading) return <div>불러오는 중…</div>;
  if (err) return <div style={{ color: "#d33" }}>{err}</div>;
  if (!review) return <div>리뷰를 찾을 수 없습니다.</div>;

  // 날짜/시간 추출 유틸
  const pickDate = (r) =>
    r.date ??
    r.visitedDate ??
    (r.datetime && String(r.datetime).slice(0, 10)) ??
    "";

  const pickTime = (r) =>
    r.time ?? (r.datetime && String(r.datetime).slice(11, 16)) ?? "";

  // 널/타입 가드 + 날짜/시간 주입
  const safeReview = {
    ...review,
    title: review.title ?? "",
    intro: review.intro ?? "",
    detail: review.description ?? review.detail ?? "",
    images: Array.isArray(review.images) ? review.images : [],
    categories: Array.isArray(review.categories) ? review.categories : [],
    places: Array.isArray(review.places) ? review.places : [],
    date: pickDate(review), // ✅ 날짜
    time: pickTime(review), // ✅ 시간(있으면 표시)
  };

  const courseList = Array.isArray(review?.course)
    ? review.course
    : Array.isArray(review?.course?.steps)
    ? review.course.steps
    : [];

  return (
    <div className="review-detail-container">
      <div className="review-left">
        <ReviewLeftContent
          review={safeReview}
          canEdit={canEdit}
          editHref={`/reviews/${safeReview.id}/edit`}
          editState={{ review: safeReview, canEdit: true }}
        />
      </div>
      <div className="review-right">
        <ReviewSidebar review={safeReview} course={courseList} />
      </div>
    </div>
  );
}
