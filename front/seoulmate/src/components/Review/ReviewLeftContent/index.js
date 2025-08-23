import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCreditCard } from "@fortawesome/free-regular-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

const fmtCost = (v) => {
  const digits = String(v ?? "").replace(/[^\d.-]/g, "");
  const n = digits === "" ? 0 : Number(digits);
  return Number.isFinite(n) ? n.toLocaleString() : "";
};

const ReviewLeftContent = ({
  review,
  canEdit = false,
  editHref = "#",
  editState,
}) => {
  const images = useMemo(() => {
    const arr = Array.isArray(review?.images)
      ? review.images.filter(Boolean)
      : [];
    if (arr.length) return arr;
    return review?.image ? [review.image] : [];
  }, [review]);

  const [selectedImage, setSelectedImage] = useState(images[0] || null);

  useEffect(() => {
    setSelectedImage(images[0] || null);
  }, [images]);

  const region = review?.region || "";
  const title = review?.title || "";
  const createdAt = review?.createdAt || "";
  const keyword = review?.keyword ? `# ${review.keyword}` : "";
  const like = review?.like ?? 0;

  // 날짜 + 시간 표시 (둘 다 있으면 "YYYY.MM.DD HH:mm", 없으면 날짜만)
  const rawDate =
    review?.date ||
    review?.visitedDate ||
    (review?.datetime && String(review.datetime).slice(0, 10)) ||
    "";

  const rawTime =
    review?.time ||
    (review?.datetime && String(review.datetime).slice(11, 16)) ||
    "";

  const prettyDate = rawDate.includes("-")
    ? rawDate.replace(/-/g, ".")
    : rawDate;
  const visitedText = rawTime ? `${prettyDate} ${rawTime}` : prettyDate;

  const costText = fmtCost(review?.cost);
  const description = review?.description || review?.detail || "";
  const tips = review?.tips || "";

  return (
    <div className="review-left-content">
      <div className="title-meta-group">
        <div className="title-row with-action">
          {region && <span className="region-badge-title">{region}</span>}
          <h1 className="review-title">{title}</h1>
          {canEdit && (
            <Link to={editHref} state={editState} className="edit-link">
              수정
            </Link>
          )}
        </div>
        {createdAt && <p className="created-date">{createdAt} 작성</p>}
      </div>

      <div className="image-gallery-container">
        <div className="main-image-wrapper">
          {selectedImage ? (
            <img src={selectedImage} className="main-image" alt="대표 이미지" />
          ) : (
            <div className="main-image placeholder">이미지가 없습니다</div>
          )}

          {images.length > 4 && (
            <button
              type="button"
              className="overlay-show-all-button"
              onClick={() =>
                alert("전체 갤러리 보기 기능은 아직 준비 중이에요.")
              }
            >
              사진 모두 보기
            </button>
          )}
        </div>

        {images.length > 0 && (
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
        )}
      </div>

      <div className="review-header-row">
        {keyword && <span className="review-keyword">{keyword}</span>}
        <span className="review-like">
          <FontAwesomeIcon icon={faHeart} className="like-icon" /> {like}
        </span>
      </div>

      <hr className="review-divider" />

      <div className="review-meta">
        {visitedText && (
          <div className="review-info">
            <FontAwesomeIcon icon={faClock} className="review-icon" />
            <span>{visitedText}</span>
          </div>
        )}

        {costText && (
          <div className="review-info">
            <FontAwesomeIcon icon={faCreditCard} className="review-icon" />
            <span>{costText}원</span>
          </div>
        )}
      </div>

      {description && (
        <div className="review-description">
          <h2>데이트 코스 소개</h2>
          <p>{description}</p>
        </div>
      )}

      {tips && (
        <div className="review-tip">
          <h2>상세 정보 및 팁</h2>
          <p>{tips}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewLeftContent;
