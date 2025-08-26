// src/pages/ReviewDetailPage.jsx
import "./style.css";
import { useParams, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import ReviewLeftContent from "../../components/Review/ReviewLeftContent";
import ReviewSidebar from "../../components/Review/ReviewSidebar";
import api from "../../api/api";

export default function ReviewDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [search] = useSearchParams();

  // 편집 가능 여부: 상세로 올 때 state.canEdit === true 이거나, ?editable=1 쿼리로 허용
  const canEditFromState = location.state?.canEdit === true;
  const canEditFromQuery = search.get("editable") === "1";
  const canEdit = canEditFromState || canEditFromQuery;

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 항상 API에서 단건 조회 (임시/prop 데이터 의존 제거)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const token = localStorage.getItem("accessToken");
      
        const { data } = await api.get(
          `/reviews/${id}`
        );

        setReview(data);
      } catch (e) {
        console.error("[review detail] request error:", e);
        setErr("리뷰를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div>불러오는 중…</div>;
  if (err) return <div style={{ color: "#d33" }}>{err}</div>;
  if (!review) return <div>리뷰를 찾을 수 없습니다.</div>;

  // ===== 유틸 =====
  const pickDate = (r) =>
    r.date ??
    r.visitedDate ??
    (r.datetime && String(r.datetime).slice(0, 10)) ??
    "";

  const pickTime = (r) =>
    r.time ?? (r.datetime && String(r.datetime).slice(11, 16)) ?? "";

  const normalizeImages = (imgs) => {
    if (!Array.isArray(imgs)) return [];
    return imgs.map((v) => (typeof v === "string" ? v : v?.imgUrl)).filter(Boolean);
  };

  // 표시용 안전 객체
  const safeReview = {
    ...review,
    title: review.title ?? "",
    intro: review.intro ?? "",
    detail: review.description ?? review.detail ?? "",
    images: normalizeImages(review.images),
    categories: Array.isArray(review.categories) ? review.categories : [],
    places: Array.isArray(review.places) ? review.places : [],
    keyword:
      typeof review.keyword === "string"
        ? review.keyword
        : Array.isArray(review.categories)
        ? review.categories.join(" · ")
        : "",
    like: review.like ?? review.likeCount ?? 0,
    date: pickDate(review),
    time: pickTime(review),
    authorName: review.userProfile?.username || review.authorName || "",
    authorImg: review.userProfile?.imgUrl || review.authorImg || "",
  };

  // 사이드바용 코스 리스트: 별도 코스가 없으면 places 사용
  const courseList = Array.isArray(review?.course)
    ? review.course
    : Array.isArray(review?.course?.steps)
    ? review.course.steps
    : Array.isArray(review?.places)
    ? review.places
    : [];

  return (
    <div className="review-detail-container">
      <div className="review-left">
        <ReviewLeftContent review={safeReview} canEdit={canEdit} />
      </div>
      <div className="review-right">
        <ReviewSidebar review={safeReview} course={courseList} />
      </div>
    </div>
  );
}
