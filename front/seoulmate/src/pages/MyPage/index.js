import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./MyPage.module.css";
import Header from "../../components/Header";
import Account from "../../images/account.png";
import ReviewCard from "../../components/Review/ReviewCard";

const toReviewCardData = (r) => ({
  id: r.id,
  title: r.title,
  region: r.region,
  image: r.image, // App에서 넘긴 썸네일
  visitedDate: r.visitedDate,
  cost: r.cost,
  like: r.like,
  keyword: r.keyword,
});

export default function MyPage({ reviews = [] }) {
  const navigate = useNavigate();

  // ───────────────── 탭 상태
  const [activeTab, setActiveTab] = useState("favorites"); // favorites | courses | myReviews | likedReviews

  // ───────────────── 내 리뷰 / 좋아요한 리뷰 (App의 목업 데이터 사용)
  const myReviews = useMemo(
    () =>
      [...reviews]
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 3),
    [reviews]
  );

  const likedReviews = useMemo(
    () =>
      [...reviews]
        .filter((r) => Number(r.like) > 0)
        .sort((a, b) => Number(b.like) - Number(a.like))
        .slice(0, 3),
    [reviews]
  );

  // ───────────────── 관심 장소 (임시)
  const [places, setPlaces] = useState([
    {
      id: 1,
      title: "카페오가닉 여의도 본점",
      district: "영등포구",
      address: "여의동로",
      savedAt: "2025-08-10T12:30:00Z",
      liked: true,
      lat: 37.523,
      lng: 126.926,
    },
  ]);

  // ───────────────── 나의 데이트 코스 (임시 데이터)
  const [courses] = useState([
    {
      id: 101,
      date: "2025.05.31",
      region: "종로구",
      title: "야경 데이트",
      thumb: "/images/test/date1.jpg",
      count: 3,
    },
  ]);

  const counts = {
    favorites: places.length,
    courses: courses.length,
    myReviews: myReviews.length,
    likedReviews: likedReviews.length,
  };

  // ───────────────── 액션들
  const openOnMap = (place) => {
    alert(`${place.title} 지도로 이동 (연결 예정)`);
  };
  const toggleLike = (id) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked } : p))
    );
  };
  const handleDeleteAll = () => {
    if (window.confirm("관심 장소를 모두 삭제할까요?")) setPlaces([]);
  };
  const goCourseDetail = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className={styles.page}>
      <Header />

      {/* 배너 */}
      <section className={styles.banner}>
        <div className={styles.bannerInner}>
          <div className={styles.avatar}>
            <img src={Account} alt="프로필" className={styles.avatarImg} />
          </div>
          <div className={styles.username}>UserName</div>
          <div className={styles.bannerActions}>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => navigate("/course")}
            >
              데이트 코스 생성
            </button>
          </div>
        </div>
      </section>

      {/* 탭 */}
      <nav className={`${styles.row} ${styles.tabs}`}>
        <button
          className={`${styles.tab} ${
            activeTab === "favorites" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("favorites")}
          type="button"
        >
          관심있는 장소{" "}
          <span className={styles.tabCount}>{counts.favorites}</span>
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "courses" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("courses")}
          type="button"
        >
          나의 데이트 코스{" "}
          <span className={styles.tabCount}>{counts.courses}</span>
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "myReviews" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("myReviews")}
          type="button"
        >
          내가 쓴 리뷰{" "}
          <span className={styles.tabCount}>{counts.myReviews}</span>
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "likedReviews" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("likedReviews")}
          type="button"
        >
          좋아요 누른 리뷰{" "}
          <span className={styles.tabCount}>{counts.likedReviews}</span>
        </button>
      </nav>

      {/* 콘텐츠 */}
      <main className={`${styles.row} ${styles.content}`}>
        {/* 관심있는 장소 */}
        {activeTab === "favorites" && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>관심있는 장소 목록</h2>
              <div className={styles.sortGroup}>
                <button className={styles.darkBtnXS}>저장순</button>
                <button className={styles.grayBtn}>지역구 이름 순</button>
              </div>
            </div>

            <ul className={styles.placeList}>
              {places.length === 0 ? (
                <div className={styles.empty}>저장한 장소가 없습니다.</div>
              ) : (
                places.map((p) => (
                  <li key={p.id} className={styles.placeCard}>
                    <div>
                      <div className={styles.placeTitle}>{p.title}</div>
                      <div className={styles.placeMeta}>
                        {p.district} · {p.address}
                      </div>
                    </div>
                    <div className={styles.placeRight}>
                      <button
                        type="button"
                        className={styles.mapBtn}
                        onClick={() => openOnMap(p)}
                      >
                        지도에서 보기
                      </button>
                      <button
                        type="button"
                        className={styles.heartBtn}
                        onClick={() => toggleLike(p.id)}
                        aria-label={p.liked ? "좋아요 취소" : "좋아요"}
                      >
                        {p.liked ? "♥" : "♡"}
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>

            <div className={styles.footerActionsRight}>
              <button
                type="button"
                className={styles.darkBtn}
                onClick={handleDeleteAll}
              >
                삭제
              </button>
            </div>
          </>
        )}

        {/* 나의 데이트 코스 */}
        {activeTab === "courses" && (
          <>
            <h2 className={styles.sectionTitle}>나의 데이트 코스 목록</h2>
            <ul className={styles.courseList}>
              {courses.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={styles.courseCard}
                    onClick={() => goCourseDetail(c.id)}
                  >
                    <div className={styles.cardThumb}>
                      <img src={c.thumb} alt={c.title} />
                      <div className={styles.cardBadge}>{c.date} 저장</div>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardRegion}>{c.region}</div>
                      <div className={styles.cardTitle}>{c.title}</div>
                      <div className={styles.cardMeta}>
                        선택한 장소 {c.count}개
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* 내가 쓴 리뷰 */}
        {activeTab === "myReviews" && (
          <>
            <h2 className={styles.sectionTitle}>내가 쓴 리뷰 목록</h2>
            <div className={styles.reviewGrid}>
              {myReviews.map((r) => (
                <ReviewCard key={r.id} review={toReviewCardData(r)} />
              ))}
            </div>
          </>
        )}

        {/* 좋아요 누른 리뷰 */}
        {activeTab === "likedReviews" && (
          <>
            <h2 className={styles.sectionTitle}>좋아요 누른 리뷰 목록</h2>
            <div className={styles.reviewGrid}>
              {likedReviews.map((r) => (
                <ReviewCard key={r.id} review={toReviewCardData(r)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
