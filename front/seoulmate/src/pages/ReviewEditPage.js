import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReviewForm from "./ReviewForm";

/* 카테고리/키워드 유틸 */
const ALL_CATEGORY_LABELS = [
  "맛집",
  "음식점",
  "카페",
  "디저트",
  "자연",
  "산책",
  "야경",
  "감성",
  "명소",
  "힐링",
  "쇼핑",
  "실내",
  "전시",
  "팝업",
  "공연",
  "영화관",
  "액티비티",
  "드라이브",
];
// "# 맛집 · 디저트" → ["맛집","디저트"]
const deriveCatsFromKeyword = (kw) => {
  if (!kw) return [];
  return String(kw)
    .replace(/^#\s*/, "")
    .split("·")
    .map((s) => s.trim())
    .filter((s) => s && ALL_CATEGORY_LABELS.includes(s));
};
// ["맛집","디저트"] → "맛집 · 디저트"
const buildKeyword = (cats) =>
  (Array.isArray(cats) ? cats : []).filter(Boolean).join(" · ");

/* 보조 유틸 */
const numFromCurrency = (v) => {
  const s = String(v ?? "").replace(/[^\d.-]/g, "");
  return s === "" ? 0 : Number(s);
};
const isoDate = (v) => {
  const s = String(v ?? "").trim();
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(s)) return s.replace(/\./g, "-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "";
};

/* ReviewForm이 기대하는 형태로 매핑 + 카테고리/키워드 정규화 */
const toInitialData = (r) => {
  const cats =
    Array.isArray(r.categories) && r.categories.length
      ? r.categories
      : deriveCatsFromKeyword(r.keyword);

  return {
    id: r.id,
    title: r.title ?? "",
    intro: r.intro ?? "",
    detail: r.detail ?? r.description ?? "",
    region: r.region ?? "",
    categories: cats,
    keyword: buildKeyword(cats), // ✅ 정규화된 키워드 동봉
    places: Array.isArray(r.places)
      ? r.places
      : Array.isArray(r.course)
      ? r.course
      : Array.isArray(r.course?.steps)
      ? r.course.steps
      : [],
    images: Array.isArray(r.images) ? r.images : r.image ? [r.image] : [],
    date: isoDate(r.date ?? r.visitedDate),
    time: r.time ?? "",
    cost: numFromCurrency(r.cost),
    datetime: r.datetime ?? null,
  };
};

export default function ReviewEditPage({ reviews }) {
  const { id } = useParams();
  const reviewId = useMemo(() => Number(id), [id]);
  const { state } = useLocation();
  const navigate = useNavigate();

  const passed = state?.review || null;
  const prefill = state?.prefill || null; // ✅ 추가: 상세에서 넘어온 프리필

  const fromProp = useMemo(() => {
    if (!Array.isArray(reviews)) return null;
    return reviews.find((r) => Number(r.id) === reviewId) || null;
  }, [reviews, reviewId]);

  const [review, setReview] = useState(passed || fromProp || null);
  const [loading, setLoading] = useState(!passed && !fromProp);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (review) {
      setLoading(false);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await axios.get(`/api/reviews/${reviewId}`);
        if (!ignore) setReview(data);
      } catch {
        if (!ignore) setErr("리뷰를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [review, reviewId]);

  if (loading) return <div>불러오는 중…</div>;
  if (err) return <div style={{ color: "#d33" }}>{err}</div>;
  if (!review) return <div>리뷰를 찾을 수 없습니다.</div>;

  const handleUpdate = async (payload) => {
    const body = {
      id: reviewId,
      title: payload.title,
      region: payload.region,
      categories: payload.categories,
      keyword: payload.keyword,
      places: payload.places,
      intro: payload.intro,
      detail: payload.detail,
      cost: payload.cost,
      date: payload.date,
      time: payload.time || "",
      datetime: payload.datetime ?? null,
    };

    // await axios.put(`/api/reviews/${reviewId}`, body);

    alert("리뷰가 수정되었습니다.");
    navigate(`/reviews/${reviewId}`, {
      state: { review: { ...review, ...body }, canEdit: true },
    });
  };

  return (
    <div className="review-edit-page">
      {" "}
      {/* ✅ maxWidth 제거 */}
      <ReviewForm
        mode="edit"
        initialData={toInitialData(review)}
        prefill={prefill}
        onSubmit={handleUpdate}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
