// src/pages/CourseEditPage.jsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import CourseForm from "./CourseForm";
import api from "../api/api"; // ✅ pages 기준 한 단계 위

// 문자열/날짜 -> Date (react-datepicker 호환)
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const onlyDate = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = new Date(onlyDate ? `${v}T00:00:00` : v);
  return isNaN(+d) ? null : d;
};

// 장소 표준화 (폼에서는 number로 보유, 서버 전송 시 문자열로 변환)
const normPlace = (p, idx = 0) => {
  const pid =
    p?.placeId ??
    p?.id ??
    (p?.x && p?.y ? `${p.x}-${p.y}` : `p-${idx}-${Math.random().toString(36).slice(2, 7)}`);

  // 서버가 내려준 category를 유지(없으면 빈 문자열)
  const categoryRaw = p?.category ?? p?.category_group_name ?? p?.category_name ?? "";

  return {
    placeId: String(pid),
    name: p?.name ?? p?.place_name ?? "",
    lat: parseFloat(p?.lat ?? p?.y ?? 0) || 0,
    lng: parseFloat(p?.lng ?? p?.x ?? 0) || 0,
    address: p?.address ?? p?.road_address_name ?? p?.address_name ?? "",
    url: p?.url ?? p?.place_url ?? "",
    category: categoryRaw,
  };
};

// 서버 응답 -> CourseForm 초기값
const toFormData = (c) => {
  const base = Array.isArray(c.places) ? c.places : Array.isArray(c.steps) ? c.steps : [];
  const places = base.map(normPlace);

  // ★ 폼은 selectedPlaces만 기준으로 동작 → 없으면 places로 채움
  const selectedPlaces = Array.isArray(c.selectedPlaces)
    ? c.selectedPlaces.map(normPlace)
    : places;

  return {
    title: c.title ?? "",
    datetime: toDate(c.datetime ?? c.date),
    categories: Array.isArray(c.categories) ? c.categories : [], // ★ 카테고리 초기값
    places,          // (참고/미리보기용)
    selectedPlaces,  // ★ 단일 소스
  };
};

export default function CourseEditPage() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false); // 중복 전송 방지

  // 1) 상세에서 넘어온 state 사용, 2) 없으면 서버 재조회
  useEffect(() => {
    if (state?.course) {
      setData(toFormData(state.course));
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(`/courses/${courseId}`);
        setData(toFormData(res)); // { id, datetime, title, categories, places: [...] }
      } catch (e) {
        console.error("[course edit] fetch error:", e);
        alert("코스를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, state?.course]);

 const handleUpdate = async (payload) => {
  if (submitting) return;
  setSubmitting(true);
  try {
    const list =
      (payload?.selectedPlaces?.length ? payload.selectedPlaces : payload.places) || [];

    const body = {
      title: payload.title,
      datetime: payload.datetime ? payload.datetime.toISOString() : null,
      categories: Array.isArray(payload.categories) ? payload.categories : [],
      places: list.map((p, i) => ({
        placeId: String(p.placeId ?? p.id ?? `p-${i}`),
        name: p.name ?? "",
        lat: String(p.lat ?? p.y ?? ""),
        lng: String(p.lng ?? p.x ?? ""),
        address: p.address ?? p.road_address_name ?? p.address_name ?? "",
        url: p.url ?? p.place_url ?? "",
        category: p.category ?? "",
      })),
    };

    await api.put(`/courses/${courseId}`, body);
    alert("코스가 수정되었습니다.");
    nav(`/courses/${courseId}`);
  } catch (e) {
    console.error("[course edit] update error:", e);
    alert("코스를 저장하는 중 오류가 발생했습니다.");
  } finally {
    setSubmitting(false);
  }
};


  if (loading) return <div>불러오는 중…</div>;
  if (!data) return <div>데이터가 없습니다.</div>;

  return (
    <CourseForm
      mode="edit"
      initialData={data}
      onSubmit={handleUpdate}
      onCancel={() => nav(-1)}
      submitting={submitting}
    />
  );
}
