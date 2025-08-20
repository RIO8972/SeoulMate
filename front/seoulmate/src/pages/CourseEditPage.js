import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import CourseForm from "./CourseForm";

// 문자열/날짜를 Date로 변환 (react-datepicker 호환)
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const onlyDate = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = new Date(onlyDate ? `${v}T00:00:00` : v);
  return isNaN(+d) ? null : d;
};

// ✅ 장소 객체 표준화 (항상 placeId 보장)
const normPlace = (p, idx = 0) => {
  const pid =
    p.placeId ??
    p.id ??
    (p.x && p.y
      ? `${p.x}-${p.y}`
      : `p-${idx}-${Math.random().toString(36).slice(2, 7)}`);

  return {
    placeId: String(pid),
    name: p.name ?? p.place_name ?? "",
    lat: parseFloat(p.lat ?? p.y ?? 0) || 0,
    lng: parseFloat(p.lng ?? p.x ?? 0) || 0,
    address: p.address ?? p.road_address_name ?? p.address_name ?? "",
    url: p.url ?? p.place_url ?? "",
    category: p.category ?? p.category_group_name ?? "",
    stay: p.stay ?? "",
  };
};

function toFormData(c) {
  const base = Array.isArray(c.places)
    ? c.places
    : (c.steps ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        stay: s.stay,
      }));

  // ✅ 깊은 복사 + 표준화 (places / selectedPlaces 둘 다 독립 배열)
  const places = base.map(normPlace);
  const selectedPlaces = (
    Array.isArray(c.selectedPlaces) ? c.selectedPlaces : base
  ).map(normPlace);

  return {
    title: c.title ?? "",
    datetime: toDate(c.datetime ?? c.date),
    places,
    selectedPlaces,
  };
}

export default function CourseEditPage() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // 1) 상세에서 넘어온 데이터 우선
    if (state?.course) {
      setData(toFormData(state.course));
      setLoading(false);
      return;
    }
    // 2) 새로고침/직접접속 시 API (연결 시 사용)
    (async () => {
      try {
        const res = await axios.get(`/api/courses/${courseId}`);
        setData(toFormData(res.data));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, state?.course]);

  const handleUpdate = async (payload) => {
    // 백엔드 붙이면 사용
    // await axios.put(`/api/courses/${courseId}`, {
    //   ...payload,
    //   datetime: payload.datetime ? payload.datetime.toISOString() : null,
    // });
    nav(`/courses/${courseId}`);
  };

  if (loading) return <div>불러오는 중…</div>;
  if (!data) return <div>데이터가 없습니다.</div>;

  return (
    <CourseForm
      mode="edit"
      initialData={data}
      onSubmit={handleUpdate}
      onCancel={() => nav(-1)}
    />
  );
}
