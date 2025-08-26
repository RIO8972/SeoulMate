import { Link } from "react-router-dom";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCreditCard } from "@fortawesome/free-regular-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

export default function ReviewCard({ review, to}) { //state가 마이페이 누르면 수정
  const card = (
    <div className="review-card-inner">
      <div className="image-wrapper">
        <div className="region-badge">{review.region}</div>
        <img src={review.image} alt={review.title} />
      </div>

      <div className="text-wrapper">
        <div className="info-top">
          <h3 className="info-title">{review.title}</h3>

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

  // 항상 Link 하나만 사용(이중 네비게이션 방지)
  return (
    <Link
      to={to ?? `/reviews/${review.id}`}
      className="review-card"
    >
      {card}
    </Link>
  );
}
