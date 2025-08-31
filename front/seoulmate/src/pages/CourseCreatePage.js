import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import CourseForm from "./CourseForm";
import api from "../api/api";

/** 카테고리 간단화(PlaceSelector/PlaceCard와 동일 규칙) */
const simplifyCategory = (raw = "") => {
  const s = String(raw).trim();
  if (!s) return "";
  const t = s.replace(/\s/g, "");
  if (/관광|명소|여행|유적|전망대|랜드마크/.test(t)) return "관광명소";
  if (/카페|디저트/.test(t)) return "카페";
  if (/음식|식당|한식|중식|양식|일식|분식|치킨|피자|고기|회|국수|돈까스/.test(t)) return "음식점";
  if (/숙박|호텔|모텔|펜션|리조트|게스트/.test(t)) return "숙박";
  if (/쇼핑|시장|백화점|아울렛|마트|편의점/.test(t)) return "쇼핑";
  if (/문화|박물관|전시|미술관|공연|도서관|영화관|극장/.test(t)) return "문화시설";
  if (/공원|자연|산|호수|강|해변|섬|둘레길|산책로|정원/.test(t)) return "자연/공원";
  return s.split(">").shift()?.trim() ?? "기타";
};

/** 폼에서 편하게 다루도록 장소 표준화 + category 포함 */
const normPlace = (p, idx = 0) => {
  const pid =
    p?.placeId ??
    p?.id ??
    (p?.x && p?.y ? `${p.x}-${p.y}` : `p-${idx}-${Math.random().toString(36).slice(2, 7)}`);

  const categoryRaw =
    p?.category ??
    p?.category_group_name ??
    p?.category_name ??
    "";

  return {
    placeId: String(pid),
    name: p?.name ?? p?.place_name ?? "",
    lat: Number(p?.lat ?? p?.y ?? 0) || 0,
    lng: Number(p?.lng ?? p?.x ?? 0) || 0,
    address: p?.address ?? p?.road_address_name ?? p?.address_name ?? "",
    url: p?.url ?? p?.place_url ?? "",
    category: simplifyCategory(categoryRaw),
  };
};

export default function CourseCreatePage() {
  const nav = useNavigate();
  const { state } = useLocation(); // e.g. { prefill: { place } }

  // 프리필(선택 장소 1개)을 초기값으로
  const initialData = useMemo(() => {
    const prefillPlace = state?.prefill?.place ? normPlace(state.prefill.place) : null;
    return {
      title: "",
      datetime: "",
      places: prefillPlace ? [prefillPlace] : [],
      selectedPlaces: prefillPlace ? [prefillPlace] : [],
    };
  }, [state?.prefill]);

  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (payload) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 서버 스펙(CourseRequestDto)에 맞춰 변환
      const body = {
        title: payload.title,
        datetime: payload.datetime
          ? (payload.datetime instanceof Date
              ? payload.datetime
              : new Date(payload.datetime)
            ).toISOString()
          : null,
        places: (payload.selectedPlaces?.length ? payload.selectedPlaces : payload.places || []).map(
          (p, i) => ({
            placeId: String(p.placeId ?? p.id ?? `p-${i}`),
            name: p.name ?? "",
            lat: String(p.lat ?? p.y ?? ""),
            lng: String(p.lng ?? p.x ?? ""),
            address: p.address ?? p.road_address_name ?? p.address_name ?? "",
            url: p.url ?? p.place_url ?? "",
            category: p.category ?? "",
          })
        ),
      };

      // ✅ 전송 직전 로깅
      console.groupCollapsed("[CourseCreatePage] POST /courses payload");
      console.log("title:", body.title);
      console.log("datetime(iso):", body.datetime);
      console.log("places (raw):", body.places);
      // 보기 쉽게 테이블로도
      console.table(
        body.places.map((p) => ({
          placeId: p.placeId,
          name: p.name,
          category: p.category,
          lat: p.lat,
          lng: p.lng,
        }))
      );
      console.groupEnd();

      const token = localStorage.getItem("accessToken") || "";
      const res = await api.post("/courses", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // ✅ 응답 로깅
      console.log("[CourseCreatePage] /courses response:", res.status, res.data);

      const newId = res?.data?.id;
      if (newId) {
        alert("코스가 생성되었습니다.");
        nav(`/courses/${newId}`);
      } else {
        alert("코스가 생성되었습니다.");
        nav("/mypage");
      }
    } catch (e) {
      // ✅ 에러 로깅(서버 메시지까지)
      if (e.response) {
        console.error(
          "[CourseCreatePage] /courses error:",
          e.response.status,
          e.response.data
        );
      } else {
        console.error("[CourseCreatePage] /courses error:", e);
      }
      alert("코스를 생성하는 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CourseForm
      mode="create"
      initialData={initialData}
      onSubmit={handleCreate}
      onCancel={() => nav(-1)}
      submitting={submitting}
    />
  );
}
