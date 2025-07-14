// 리뷰 카드 구성
import React from "react";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCreditCard } from "@fortawesome/free-regular-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const ReviewCard = ({ review }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/review/${review.id}`);
  };

  return (
    <div className="review-card" onClick={handleClick}>
      <div className="image-wrapper">
        <div className="region-badge">{review.region}</div>
        <img src={review.image} alt={review.title} />
      </div>
      <div className="text-wrapper">
        <div className="info-top">
          <h3 className="info-title">{`${review.title}`}</h3>

          <div className="info-item">
            <FontAwesomeIcon icon={faClock} className="info-icon" />
            <span>{review.visitedDate}</span>
          </div>
          <div className="info-item">
            <FontAwesomeIcon icon={faCreditCard} className="info-icon" />
            <span>{review.cost}</span>
          </div>
        </div>
        <div className="info-bottom">
          <p className="keywords">{review.keyword}</p>
          <div className="likes">
            <FontAwesomeIcon icon={faHeart} style={{ color: "#e74c3c" }} />
            <span className="like-count">{review.like}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
