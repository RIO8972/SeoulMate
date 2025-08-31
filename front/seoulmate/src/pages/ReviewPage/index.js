// src/pages/ReviewPage.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./style.css";
import Header from "../../components/Header";
import ReviewCard from "../../components/Review/ReviewCard";
import axios from "axios";
import useInfiniteReviews from "../../hooks/useInfiniteReviews";

// 서울 지역 리스트
const seoulDistricts = [
  "전체","강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구",
  "송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구",
];

/* 날짜 포맷터: 2025.08.02 형태 */
const fmtYmd = (val) => {
  if (!val) return "";
  const s = String(val);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}.${mo}.${dd}`;
};

/** 서버 리뷰 → ReviewCard가 기대하는 형태로 변환 (마이페이지와 동일 규격) */
const toReviewCardData = (r) => ({
  id: r.id,
  title: r.title,
  region: r.region || r.district || "",
  image:
    r.image ||
    r.thumbnail ||
    (Array.isArray(r.images) ? r.images[0]?.imgUrl || r.images[0]?.url : undefined),
  visitedDate: fmtYmd(r.datetime || r.createdAt || r.created_at),
  cost: r.cost ?? 0,
  like: r.like_count ?? r.likeCount ?? r.like ?? 0,
  keyword: r.keyword ?? (Array.isArray(r.categories) ? r.categories.join(" · ") : ""),
});

const ReviewPage = () => {
  const [sortType, setSortType] = useState("latest"); // "latest" | "popular"
  const [selectedRegion, setSelectedRegion] = useState("전체");

  // 서버 무한 스크롤
  const { items, setItems, loading, hasNext, sentinelRef, reload } =
    useInfiniteReviews({ pageSize: 12 });

  // 정렬/필터 바뀌면 리스트 초기화 후 다시 로드
  React.useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortType, selectedRegion]);

  // 지역 필터 (프론트에서)
  const filtered = useMemo(() => {
    if (selectedRegion === "전체") return items;
    return items.filter((r) => r.region === selectedRegion);
  }, [items, selectedRegion]);

  // 정렬 (프론트에서)
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortType === "popular") {
      arr.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    } else {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return arr;
  }, [filtered, sortType]);

  // ReviewCard 규격으로 변환
  const adapted = useMemo(() => sorted.map(toReviewCardData), [sorted]);

  // 좋아요 토글 (카운트만 동기화)
  const onToggleLike = async (id) => {
    try {
      const { data } = await axios.post(`http://localhost:8080/reviews/${id}/like`);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, likeCount: data.likeCount } : it
        )
      );
    } catch (e) {
      console.error("toggleLike error:", e);
    }
  };

  return (
    <div className="review-page">
      <Header />
      <div className="review-layout">
        <div className="review-top">
          {/* 지역 선택 드롭다운 */}
          <div className="region-header">
            <select
              className="region-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {seoulDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 버튼 */}
          <div className="filter-tabs">
            <button
              className={sortType === "latest" ? "active" : ""}
              onClick={() => setSortType("latest")}
            >
              최신순
            </button>
            <button
              className={sortType === "popular" ? "active" : ""}
              onClick={() => setSortType("popular")}
            >
              인기순
            </button>
          </div>
        </div>

        {/* 리뷰 카드 (UI 동일) */}
        <div className="review-grid">
          {adapted.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              to={`/reviews/${review.id}`}
              onToggleLike={() => onToggleLike(review.id)} // ReviewCard가 지원하면 동작
            />
          ))}
        </div>

        {/* 무한 스크롤 센티넬 */}
        <div ref={sentinelRef} style={{ height: 1 }} />

        {/* 상태 표시 */}
        {loading && (
          <div style={{ padding: 12, color: "#6b7280" }}>불러오는 중…</div>
        )}
        {!hasNext && items.length > 0 && (
          <div style={{ padding: 12, color: "#9ca3af" }}>끝까지 확인했어요</div>
        )}
      </div>

      {/* 리뷰 작성 */}
      <div className="write-button-container">
        <p>자신만의 데이트 코스를 공유해보세요!</p>
        <Link to="/review/new">
          <button className="write-review">리뷰 작성하기</button>
        </Link>
      </div>
    </div>
  );
};

export default ReviewPage;
