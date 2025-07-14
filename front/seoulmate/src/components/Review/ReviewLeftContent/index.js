import { useState, useEffect, useMemo } from "react";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCreditCard } from "@fortawesome/free-regular-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

const ReviewLeftContent = ({ review }) => {
  const images = useMemo(() => {
    return review.images || [review.image];
  }, [review]);

  const [selectedImage, setSelectedImage] = useState(images[0]);

  useEffect(() => {
    setSelectedImage(images[0]);
  }, [images]);

  const handleOpenGallery = () => {
    alert("전체 갤러리 보기 기능은 아직 준비 중이에요.");
  };

  return (
    <div className="review-left-content">
      <div className="title-meta-group">
        <div className="title-row">
          <span className="region-badge-title">{review.region}</span>
          <h1 className="review-title">{review.title}</h1>
        </div>
        <p className="created-date">{review.createdAt} 작성</p>
      </div>

      <div className="image-gallery-container">
        <div className="main-image-wrapper">
          <img src={selectedImage} className="main-image" alt="대표 이미지" />
          {images.length > 4 && (
            <button
              className="overlay-show-all-button"
              onClick={handleOpenGallery}
            >
              사진 모두 보기
            </button>
          )}
        </div>

        <div className="thumbnail-grid-wrapper">
          <div className="thumbnail-grid">
            {images.slice(0, 4).map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`thumb-${i}`}
                className={`thumbnail ${
                  selectedImage === img ? "selected" : ""
                }`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="review-header-row">
        <span className="review-keyword"># {review.keyword}</span>
        <span className="review-like">
          <FontAwesomeIcon icon={faHeart} className="like-icon" />
          {review.like}
        </span>
      </div>
      <hr className="review-divider" />
      <div className="review-meta">
        <div className="review-info">
          <FontAwesomeIcon icon={faClock} className="review-icon" />
          <span>{review.visitedDate}</span>
        </div>
        <div className="review-info">
          <FontAwesomeIcon icon={faCreditCard} className="review-icon" />
          <span>{review.cost}</span>
        </div>
      </div>

      {review.description && (
        <div className="review-description">
          <h2>데이트 코스 소개</h2>
          <p>{review.description}</p>
        </div>
      )}

      {review.tips && (
        <div className="review-tip">
          <h2>상세 정보 및 팁</h2>
          <p>{review.tips}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewLeftContent;
