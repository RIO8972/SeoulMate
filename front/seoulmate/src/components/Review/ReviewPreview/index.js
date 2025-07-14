// 메인 페이지 리뷰 더보기
import React from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleRight } from "@fortawesome/free-regular-svg-icons";
import ReviewCard from "../ReviewCard";

const ReviewPreview = ({ reviews }) => {
  const navigate = useNavigate();

  const popularReviews = [...reviews]
    .sort((a, b) => b.like - a.like)
    .slice(0, 4);

  return (
    <section className="review-preview-wrapper">
      <div className="preview-header">
        <button className="more-button" onClick={() => navigate("/reviews")}>
          리뷰 더보기
          <FontAwesomeIcon
            icon={faCircleRight}
            style={{ marginLeft: "6px", fontSize: "18px" }}
          />
        </button>
      </div>

      <div className="review-card-list">
        {popularReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
};

export default ReviewPreview;
