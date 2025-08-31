// src/pages/CourseCreatePage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
// import axios from "axios";
import CourseForm from "./CourseForm";
import api from "../api/api";

// 폼에서 편하게 다루도록 장소 표준화(카카오/내 데이터 모두 수용)
const normPlace = (p, idx = 0) => {
  const pid =
    p?.placeId ??
    p?.id ??
    (p?.x && p?.y ? `${p.x}-${p.y}` : `p-${idx}-${Math.random().toString(36).slice(2, 7)}`);

  return {
    placeId: String(pid),
    name: p?.name ?? p?.place_name ?? "",
    lat: Number(p?.lat ?? p?.y ?? 0) || 0,
    lng: Number(p?.lng ?? p?.x ?? 0) || 0,
    address: p?.address ?? p?.road_address_name ?? p?.address_name ?? "",
    url: p?.url ?? p?.place_url ?? "",
  };
};

export default function CourseCreatePage() {
  const nav = useNavigate();
  const { state } = useLocation(); // e.g. { prefill: { place } }

  // 리뷰/검색 등에서 넘어온 프리필(선택 장소 1개)을 초기값으로 넣어줌
  const initialData = useMemo(() => {
    const prefillPlace = state?.prefill?.place ? normPlace(state.prefill.place) : null;
    return {
      title: "",
      datetime: "",          // CourseForm에서 ""(string) or Date 둘 다 허용
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
        // 백엔드에서 java.util.Date로 받으므로 ISO 문자열로 전송
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
            lat: String(p.lat ?? p.y ?? ""),  // 서버 DTO가 String 필드
            lng: String(p.lng ?? p.x ?? ""),
            address: p.address ?? p.road_address_name ?? p.address_name ?? "",
            url: p.url ?? p.place_url ?? "",
          })
        ),
      };

      const token = localStorage.getItem("accessToken") || "";
      const res = await api.post("/courses", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const newId = res?.data?.id; // 서버가 id를 돌려주면 상세로 이동
      if (newId) {
        alert("코스가 생성되었습니다.");
        nav(`/courses/${newId}`);
      } else {
        alert("코스가 생성되었습니다.");
        nav("/mypage"); // id를 안 주면 마이페이지 등으로
      }
    } catch (e) {
      console.error("[course create] error:", e);
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
