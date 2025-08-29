// src/pages/MyPage/index.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MyPage.module.css";
import Header from "../../components/Header";
import Account from "../../images/account.png";
import ReviewCard from "../../components/Review/ReviewCard";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import api from "../../api/api";

/* 날짜 포맷터: 2025.08.02 형태로 변환 */
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

/* 주소에서 '강남구' 같은 구 이름 뽑기 */
const extractDistrict = (address) => {
  if (!address) return "";
  const parts = String(address).trim().split(/\s+/);
  return parts[1] || "";
};

/* 카드 매퍼(리뷰) */
const toReviewCardData = (r) => ({
  id: r.id,
  title: r.title,
  region: r.region || r.district || "",
  image:
    r.image ||
    r.thumbnail ||
    (Array.isArray(r.images)
      ? r.images[0]?.imgUrl || r.images[0]?.url
      : undefined),
  visitedDate: fmtYmd(r.datetime || r.createdAt || r.created_at),
  cost: r.cost ?? 0,
  like: r.like_count ?? r.likeCount ?? r.like ?? 0,
  keyword:
    r.keyword ?? (Array.isArray(r.categories) ? r.categories.join(" · ") : ""),
});

/* 카드 매퍼(코스) */
const toCourseCard = (c, idx = 0) => ({
  id: c.id ?? `${c.title}-${c.datetime}-${idx}`,
  title: c.title,
  date: fmtYmd(c.datetime),
  region: extractDistrict(c.places?.[0]?.address),
  count: Array.isArray(c.places) ? c.places.length : 0,
  thumb: c.thumb || "/images/test/date1.jpg",
});

export default function MyPage() {
  const navigate = useNavigate();

  // 프로필
  const [me, setMe] = useState(null);

  // 내 리뷰
  const [fetchedReviews, setFetchedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 내 코스
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // 내가 좋아요한 리뷰
  const [likedReviewsFetched, setLikedReviewsFetched] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(true);

  // 내 찜(관심) 장소
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // 관심 탭 정렬 상태
  const [favSort, setFavSort] = useState("saved"); // "saved" | "district"

  const handleAvatarError = (e) => {
    e.currentTarget.src = Account;
    e.currentTarget.onerror = null;
  };

  // 내 정보
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    api
      .get("users/me")
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  //내 찜 목록 조회
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoadingFavorites(false);
      return;
    }
    setLoadingFavorites(true);
    api
      .get("carts/mine")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        // UI 포맷으로 변환
        const mapped = list.map((p, i) => ({
          id: String(p.placeId),
          title: p.name,
          district: extractDistrict(p.address),
          address: p.address,
          url: p.url,
          lat: p.lat,
          lng: p.lng,
          liked: true, // 찜 목록이므로 기본 true
          _savedIndex: i, // 저장순 정렬용
        }));
        setFavorites(mapped);
      })
      .catch((err) => {
        console.error("내 찜 목록 조회 실패:", err);
        if (err.response?.status === 401) {
          alert("로그인이 필요합니다.");
        } else {
          alert("관심있는 장소를 불러오지 못했습니다.");
        }
      })
      .finally(() => setLoadingFavorites(false));
  }, []);

  // 내 리뷰 불러오기
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    api
      .get("/reviews/mine")
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.content)
          ? res.data.content
          : [];
        setFetchedReviews(list);
      })
      .catch((err) => {
        console.error("내 리뷰 조회 실패:", err);
        if (err.response?.status === 401) {
          alert("로그인이 필요합니다.");
        } else {
          alert("내 리뷰를 불러오지 못했습니다.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // 내 코스 불러오기
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoadingCourses(true);
    api
      .get("courses/mine")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const sorted = [...list].sort(
          (a, b) => new Date(b.datetime) - new Date(a.datetime)
        );
        setCourses(sorted.map((c, i) => toCourseCard(c, i)));
      })
      .catch((err) => {
        console.error("내 코스 조회 실패:", err);
      })
      .finally(() => setLoadingCourses(false));
  }, []);

  // 내가 좋아요한 리뷰 불러오기
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoadingLiked(true);
    api
      .get("reviews/mine/likes")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setLikedReviewsFetched(list);
      })
      .catch((err) => {
        console.error("좋아요한 리뷰 조회 실패:", err);
      })
      .finally(() => setLoadingLiked(false));
  }, []);

  // 탭
  const [activeTab, setActiveTab] = useState("favorites");

  // 정렬된 내 리뷰
  const myReviews = useMemo(
    () =>
      [...fetchedReviews].sort((a, b) => {
        const da = new Date(
          a.createdAt || a.created_at || a.datetime || 0
        ).getTime();
        const db = new Date(
          b.createdAt || b.created_at || b.datetime || 0
        ).getTime();
        return db - da;
      }),
    [fetchedReviews]
  );

  // 정렬된 좋아요한 리뷰
  const likedReviewsSorted = useMemo(
    () =>
      [...likedReviewsFetched].sort(
        (a, b) =>
          new Date(b.createdAt || b.datetime || 0) -
          new Date(a.createdAt || a.datetime || 0)
      ),
    [likedReviewsFetched]
  );

  // ✅ 정렬된 찜 목록
  const favoritesSorted = useMemo(() => {
    const list = [...favorites];
    if (favSort === "district") {
      return list.sort((a, b) =>
        (a.district || "").localeCompare(b.district || "")
      );
    }
    // 저장순(초기 API 순서)
    return list.sort((a, b) => (a._savedIndex ?? 0) - (b._savedIndex ?? 0));
  }, [favorites, favSort]);

  // 카운트
  const counts = {
    favorites: favorites.length,
    courses: courses?.length ?? 0,
    myReviews: myReviews.length,
    likedReviews: likedReviewsSorted.length,
  };

  const goCourseDetail = (courseId) => {
    if (!courseId) {
      alert("코스 상세 페이지가 아직 준비되지 않았습니다.");
      return;
    }
    navigate(`/courses/${courseId}`);
  };

  const openOnMap = (p) => {
    try {
      if (p?.url) window.open(p.url, "_blank", "noopener,noreferrer");
    } catch {}
  };

  // 하트 토글 자리 (API 연결 필요 시 구현)
  const toggleLike = async (placeId) => {
    // TODO: 찜 해제/추가 엔드포인트 연결되면 구현
    alert("찜 해제/추가 기능은 추후 연결됩니다.");
  };

  return (
    <div className={styles.page}>
      <Header />

      {/* 배너 */}
      <section className={styles.banner}>
        <div className={styles.bannerInner}>
          <div className={styles.avatar}>
            <img
              src={me?.imgUrl || Account}
              alt="프로필"
              className={styles.avatarImg}
              onError={handleAvatarError}
            />
          </div>
          <div className={styles.username}>{me?.username || "UserName"}</div>
          <div className={styles.bannerActions}>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => navigate("/course/new")}
            >
              데이트 코스 생성
            </button>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => navigate("/review/new")}
            >
              리뷰 생성
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
        {/* ✅ 관심있는 장소 (요청한 UI) */}
        {activeTab === "favorites" && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>관심있는 장소 목록</h2>
              <div className={styles.sortGroup}>
                <button
                  className={
                    favSort === "saved" ? styles.darkBtnXS : styles.grayBtn
                  }
                  onClick={() => setFavSort("saved")}
                  type="button"
                >
                  저장순
                </button>
                <button
                  className={
                    favSort === "district" ? styles.darkBtnXS : styles.grayBtn
                  }
                  onClick={() => setFavSort("district")}
                  type="button"
                >
                  지역구 이름 순
                </button>
              </div>
            </div>

            {loadingFavorites ? (
              <div className={styles.empty}>불러오는 중…</div>
            ) : favoritesSorted.length === 0 ? (
              <div className={styles.empty}>저장한 장소가 없습니다.</div>
            ) : (
              <ul className={styles.placeList}>
                {favoritesSorted.map((p) => (
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
                        className={`${styles.heartBtn} ${
                          p.liked ? styles.active : ""
                        }`}
                        onClick={() => toggleLike(p.id)}
                        aria-label={p.liked ? "좋아요 취소" : "좋아요"}
                      >
                        <FontAwesomeIcon
                          icon={p.liked ? solidHeart : regularHeart}
                          style={{ color: p.liked ? "#e74c3c" : "#9CA3AF" }}
                        />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* 나의 데이트 코스 */}
        {activeTab === "courses" && (
          <>
            <h2 className={styles.sectionTitle}>나의 데이트 코스 목록</h2>
            {loadingCourses ? (
              <div className={styles.empty}>불러오는 중…</div>
            ) : courses.length === 0 ? (
              <div className={styles.empty}>저장한 코스가 없습니다.</div>
            ) : (
              <ul className={styles.courseList}>
                {courses.map((c, idx) => (
                  <li key={c.id ?? idx}>
                    <button
                      type="button"
                      className={styles.courseCard}
                      onClick={() => goCourseDetail(c.id)}
                    >
                      <div className={styles.cardThumb}>
                        <img src={c.thumb} alt={c.title} loading="lazy" />
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
            )}
          </>
        )}

        {/* 내가 쓴 리뷰 */}
        {activeTab === "myReviews" && (
          <>
            <h2 className={styles.sectionTitle}>내가 쓴 리뷰 목록</h2>
            {loading ? (
              <div className={styles.empty}>불러오는 중…</div>
            ) : myReviews.length === 0 ? (
              <div className={styles.empty}>작성한 리뷰가 없습니다.</div>
            ) : (
              <div className={styles.reviewGrid}>
                {myReviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={toReviewCardData(r)}
                    to={`/reviews/${r.id}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 좋아요 누른 리뷰 */}
        {activeTab === "likedReviews" && (
          <>
            <h2 className={styles.sectionTitle}>좋아요 누른 리뷰 목록</h2>
            {loadingLiked ? (
              <div className={styles.empty}>불러오는 중…</div>
            ) : likedReviewsSorted.length === 0 ? (
              <div className={styles.empty}>좋아요한 리뷰가 없습니다.</div>
            ) : (
              <div className={styles.reviewGrid}>
                {likedReviewsSorted.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={toReviewCardData(r)}
                    to={`/reviews/${r.id}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
