import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import CourseForm from "./CourseForm";

function toFormData(c) {
  // date -> datetime-local 형식 (YYYY-MM-DDTHH:mm)
  const datetime = c.datetime ?? (c.date ? `${c.date}T00:00` : null);

  // steps -> places 로 매핑 (필요 시 필드 더 추가)
  const places = Array.isArray(c.places)
    ? c.places
    : (c.steps ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        stay: s.stay,
      }));

  return {
    title: c.title ?? "",
    datetime,
    places,
    selectedPlaces: c.selectedPlaces ?? places, // 선택 목록도 채워두기
  };
}

export default function CourseEditPage() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const { state } = useLocation(); // ✅ 상세에서 온 데이터
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // 1) 상세에서 넘어온 데이터가 있으면 그걸로 바로 초기화
    if (state?.course) {
      setData(toFormData(state.course));
      setLoading(false);
      return;
    }
    // 2) (선택) 새로고침/직접접속 시 백엔드에서 로드
    (async () => {
      try {
        const res = await axios.get(`/api/courses/${courseId}`);
        setData(toFormData(res.data));
      } catch (e) {
        console.error(e);
        // 백엔드 없으면 뒤로가기나 임시데이터로 처리
        // setData(toFormData({ title: "", date: "2025-06-10", steps: [] }));
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, state?.course]);

  const handleUpdate = async (payload) => {
    // 백엔드 연결 전이라면 PUT은 주석 처리하고 navigate만
    // await axios.put(`/api/courses/${courseId}`, payload);
    nav(`/courses/${courseId}`);
  };

  if (loading) return <div>불러오는 중…</div>;
  if (!data) return <div>데이터가 없습니다.</div>;

  return (
    <CourseForm
      mode="edit"
      initialData={data} // ✅ 폼에 초기값 주입
      onSubmit={handleUpdate}
      onCancel={() => nav(-1)}
    />
  );
}
