import "./style.css";
import { useParams } from "react-router-dom";
import ReviewLeftContent from "../../components/Review/ReviewLeftContent";
import ReviewSidebar from "../../components/Review/ReviewSidebar";

const ReviewDetailPage = ({ reviews }) => {
  const { id } = useParams();
  const review = reviews.find((r) => r.id === Number(id));

  if (!review) return <div>리뷰를 찾을 수 없습니다.</div>;

  return (
    <div className="review-detail-container">
      <div className="review-left">
        <ReviewLeftContent review={review} />
      </div>
      <div className="review-right">
        <ReviewSidebar review={review} course={review.course} />
      </div>
    </div>
  );
};

export default ReviewDetailPage;
