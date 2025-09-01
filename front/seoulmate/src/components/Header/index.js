// src/components/Header/index.jsx
import "./style.css";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import FullLogo from "../../images/full-logo.png";
import Account from "../../images/account.png";
import Menu from "../../images/menu.png";
import api from "../../api/api";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [imgVersion, setImgVersion] = useState(0); // 캐시버스트용
  const location = useLocation();

  // 최초 로드 시 내 정보
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      return;
    }
    api
      .get(`/users/me`, { params: { t: Date.now() } })
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("내 정보 조회 실패", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("accessToken");
        }
        setUser(null);
      });
  }, []);

  // ✅ 프로필 저장 후 이벤트 수신 → 리패치 + 캐시버스트
  useEffect(() => {
    const onProfileUpdated = async () => {
      try {
        const res = await api.get(`/users/me`, { params: { t: Date.now() } });
        setUser(res.data);
        setImgVersion(Date.now()); // 이미지 src에 버전 붙여 새로 로드
      } catch (err) {
        console.error("프로필 갱신 리패치 실패", err);
      }
    };
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, []);

  // 이미지 에러 시 기본 아이콘으로 복구
  const handleAvatarError = (e) => {
    e.currentTarget.src = Account;
    e.currentTarget.onerror = null;
  };

  // ✅ 캐시버스트 파라미터만 추가 (UI/스타일 영향 없음)
  const raw = user?.imgUrl || "";
  const avatarUrl = raw ? `${raw}${raw.includes("?") ? "&" : "?"}v=${imgVersion}` : Account;

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
              // 필요 시 아래 두 줄로 사이즈 고정 가능(스타일이 안 먹을 때만)
              // width={32}
              // height={32}
            />
          </Link>

          <button
            className="menu-btn"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
          >
            <img src={Menu} alt="" className="header-icon" />
          </button>
        </div>
      </header>

      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="사이드 메뉴">
            <div className="drawer-header">
              <span className="drawer-title">메뉴</span>
              <button className="drawer-close" onClick={() => setOpen(false)} aria-label="메뉴 닫기">
                ✕
              </button>
            </div>

            <nav className="drawer-nav">
              <Link to="/mypage" className="drawer-link" onClick={() => setOpen(false)}>
                마이페이지
              </Link>
              <Link to="/settings" className="drawer-link" onClick={() => setOpen(false)}>
                설정
              </Link>
              {user && (
                <Link to="/logout" className="drawer-link drawer-logout" onClick={() => setOpen(false)}>
                  로그아웃
                </Link>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default Header;
