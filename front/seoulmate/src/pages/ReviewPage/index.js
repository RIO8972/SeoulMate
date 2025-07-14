import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css";
import Header from "../../components/Header";
import ReviewList from "../../components/Review/ReviewList";

// 서울 지역 리스트
const seoulDistricts = [
  "전체",
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
];

const ReviewPage = ({ reviews }) => {
  const [sortType, setSortType] = useState("latest"); // 기본은 최신순
  const [selectedRegion, setSelectedRegion] = useState("전체"); // 지역 선택 상태

  // 지역 필터링
  const filteredReviews =
    selectedRegion === "전체"
      ? reviews
      : reviews.filter((review) => review.region === selectedRegion);

  // 정렬
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortType === "popular") return b.like - a.like;
    if (sortType === "latest")
      return new Date(b.visitedDate) - new Date(a.visitedDate);
    return 0;
  });

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

        {/* 리뷰 카드 */}
        <div className="review-grid">
          {sortedReviews.map((review) => (
            <ReviewList key={review.id} review={review} />
          ))}
        </div>
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
