import "./style.css";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import FullLogo from "../../images/full-logo.png";
import Account from "../../images/account.png";
import Menu from "../../images/menu.png";
import api from "../../api/api";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  //로그인 유무에 따라 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      return;
    }

    api
      .get(`/users/me`)
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("내 정보 조회 실패", err);
        if (err?.response?.status === 401) {
          // 만료/무효 토큰 정리
          localStorage.removeItem("accessToken");
        }
        setUser(null);
      });
  }, []);

  // 이미지 에러 시 기본 아이콘으로 복구
  const handleAvatarError = (e) => {
    e.currentTarget.src = Account;
    e.currentTarget.onerror = null;
  };
  const avatarUrl = user?.imgUrl || Account; //사용자 이미지 or 기본

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // 라우트 변경 시 자동 닫기
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="header">
        <Link to="/" className="full-logo" aria-label="홈으로 이동">
          <img src={FullLogo} alt="로고" />
        </Link>

        <div className="header-btn-layout">
          {/*로그인 유무에 따라 링크/이미지 동적 변경 */}
          <Link
            to={user ? "/profile" : "/login"}
            className="login-link"
            aria-label={user ? "마이페이지로 이동" : "로그인 페이지로 이동"}
          >
            <img
              src={avatarUrl}
              alt="프로필"
              className="header-avatar"
              onError={handleAvatarError}
            />
          </Link>

          {/* 햄버거 → 사이드바 열기 */}
          <button
            className="menu-btn"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
          >
            <img src={Menu} alt="" className="header-icon" />
          </button>
        </div>
      </header>

      {/* 오른쪽 드로어 */}
      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} />
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="사이드 메뉴"
          >
            <div className="drawer-header">
              <span className="drawer-title">메뉴</span>
              <button
                className="drawer-close"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
              >
                ✕
              </button>
            </div>

            <nav className="drawer-nav">
              <Link to="/mypage" className="drawer-link">
                마이페이지
              </Link>
              <Link to="/favorites" className="drawer-link">
                관심있는 장소
              </Link>
              <Link to="/courses" className="drawer-link">
                리뷰
              </Link>
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default Header;
