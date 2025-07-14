import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCreditCard } from "@fortawesome/free-regular-svg-icons";

const ReviewSidebar = ({ review, course }) => {
  return (
    <div className="review-sidebar-box">
      {/* 작성자 프로필 */}
      <div className="writer-profile">
        <img
          src="/images/test/bluescreen.jpg"
          alt="작성자 프로필"
          className="profile-image"
        />
        <div className="writer-text">
          <p className="writer-name">user 님</p>
          <p className="writer-meta">해시태그? 또는 설명</p>
        </div>
      </div>

      {/* 데이트 코스 요약 */}
      <div className="course-order-section">
        <div className="section-header">
          <h2>데이트 코스 순서</h2>
          <a className="see-all-link" href="#">
            모두 보기
          </a>
        </div>
        <ol className="course-list">
          {course.map((c, i) => (
            <li className="course-item" key={i}>
              <div className="step-indicator">{i + 1}</div>
              <div className="course-content">
                <div className="course-main">
                  <span className="course-place">{c.place}</span>
                  <span className="course-category">{c.category}</span>
                </div>
                <div className="course-sub">
                  <span className="course-time">
                    <FontAwesomeIcon icon={faClock} className="clock-icon" />{" "}
                    {c.time}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <button className="add-course-button">내 코스에 추가</button>
    </div>
  );
};

export default ReviewSidebar;
