import "./style.css";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import FullLogo from "../../images/full-logo.png";
import Account from "../../images/account.png";
import Menu from "../../images/menu.png";

const Header = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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
          {/* 프로필(로그인) 연결은 그대로 */}
          <Link
            to="/login"
            className="login-link"
            aria-label="로그인 또는 마이페이지"
          >
            <img src={Account} alt="" className="header-icon" />
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
                나의 데이트 코스
              </Link>
              <Link to="/settings" className="drawer-link">
                설정
              </Link>
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default Header;
