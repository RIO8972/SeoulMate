import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import ReviewForm from "./ReviewForm";

export default function ReviewEditPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/api/reviews/${id}`);
        setData(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (payload) => {
    await axios.put(`/api/reviews/${id}`, payload);
    nav(`/review/${id}`); // 수정 후 상세로
  };

  if (loading) return <div>불러오는 중…</div>;
  if (!data) return <div>데이터가 없습니다.</div>;

  return (
    <ReviewForm
      mode="edit"
      initialData={{
        title: data.title,
        date: data.date || data.visitedDate || null,
        category: data.category ?? null,
        course: data.course ?? null,
        images: data.images || [],
        description: data.description || "",
        cost: data.cost || 0,
      }}
      onSubmit={handleUpdate}
      onCancel={() => nav(-1)}
    />
  );
}
