// src/pages/ReviewEditPage.jsx
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
// import axios from "axios";
import ReviewForm from "./ReviewForm";
import api from "../api/api";

/* ------------------ 유틸 ------------------ */
const ALL_CATEGORY_LABELS = [
  "맛집","음식점","카페","디저트","자연","산책","야경","감성","명소",
  "힐링","쇼핑","실내","전시","팝업","공연","영화관","액티비티","드라이브",
];

const deriveCatsFromKeyword = (kw) => {
  if (!kw) return [];
  return String(kw)
    .replace(/^#\s*/, "")
    .split("·")
    .map((s) => s.trim())
    .filter((s) => s && ALL_CATEGORY_LABELS.includes(s));
};

const buildKeyword = (cats) =>
  (Array.isArray(cats) ? cats : []).filter(Boolean).join(" · ");

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

// 프런트 place -> 백엔드 PlaceRequestDto
const toPlaceRequest = (p, i) => ({
  placeId: String(p.placeId ?? p.id ?? `p-${i}`),
  name: p.name ?? "",
  lat: String(p.lat ?? p.y ?? ""),
  lng: String(p.lng ?? p.x ?? ""),
  address: p.address ?? p.road_address_name ?? p.address_name ?? "",
  url: p.url ?? p.place_url ?? "",
});

// 문자열/Date/없음 → ISO 문자열 또는 null
const toIsoDateTime = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return Number.isNaN(+d) ? null : d.toISOString();
};

/* ReviewForm이 기대하는 형태로 매핑 */
const toInitialData = (r) => {
  const cats =
    Array.isArray(r?.categories) && r.categories.length
      ? r.categories
      : deriveCatsFromKeyword(r?.keyword);

  const rawImages =
    (Array.isArray(r?.reviewImgs) ? r.reviewImgs : null) ??
    (Array.isArray(r?.images) ? r.images : null) ??
    (r?.image ? [r.image] : []);

  const places =
    (Array.isArray(r?.reviewPlaces) ? r.reviewPlaces : null) ??
    (Array.isArray(r?.places) ? r.places : null) ??
    (Array.isArray(r?.course?.steps) ? r.course.steps : null) ??
    (Array.isArray(r?.course) ? r.course : []) ;

  return {
    id: r?.id,
    title: r?.title ?? "",
    intro: r?.intro ?? "",
    detail: r?.detail ?? r?.description ?? "",
    region: r?.region ?? "",
    categories: cats,
    keyword: buildKeyword(cats),
    places,
    images: rawImages,
    date: isoDate(r?.date ?? r?.visitedDate),
    time: r?.time ?? "",
    cost: numFromCurrency(r?.cost),
    datetime: r?.datetime ?? null,
  };
};
/* ----------------------------------------- */

export default function ReviewEditPage() {
  const { id } = useParams();
  const reviewId = useMemo(() => Number(id), [id]);
  const { state } = useLocation();
  const prefill = state?.prefill || null;
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ 항상 파라미터 id로 백엔드 조회
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await api.get(`/reviews/${reviewId}`); // 인터셉터로 AT 자동 주입
        if (!ignore) setReview(data);
      } catch (e) {
        console.error("[review edit] fetch error:", e);
        if (!ignore) setErr("리뷰를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [reviewId]);

  if (loading) return <div>불러오는 중…</div>;
  if (err) return <div style={{ color: "#d33" }}>{err}</div>;
  if (!review) return <div>리뷰를 찾을 수 없습니다。</div>;

  // ✅ 멀티파트 PUT /reviews/{id}
  const handleUpdate = async (payload) => {
    try {
      const dto = {
        title: payload.title,
        region: payload.region,
        categories: payload.categories || [],
        cost: Number(payload.cost ?? 0),
        date: isoDate(payload.date),
        time: payload.time || "",
        detail: payload.detail ?? "",
        intro: payload.intro ?? "",
        datetime: toIsoDateTime(payload.datetime),
        places: (payload.places || payload.selectedPlaces || []).map(toPlaceRequest),
        deleteImgs: (payload.deleteImgs || payload.deletedImageIds || [])
          .map((x) => Number(x))
          .filter((n) => Number.isFinite(n)),
      };

      const form = new FormData();
      form.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));

      const newFiles = Array.isArray(payload.newImages) ? payload.newImages : [];
      newFiles.forEach((file) => form.append("images", file));

      await api.put(`/reviews/${reviewId}`, form); // FormData → Content-Type 자동 설정

      alert("리뷰가 수정되었습니다.");
      navigate(`/reviews/${reviewId}`, { state: { canEdit: true } });
    } catch (e) {
      console.error("[review edit] update error:", e);
      alert("리뷰 수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="review-edit-page">
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
