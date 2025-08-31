import React from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logoImage from "../../images/logo.png";
import { FaPen, FaArrowLeft } from "react-icons/fa";

function Sidebar({
  mode = "map", // "map" | "course"
  toWhenMap = "/course/new",
  onBack,
  setActivePanel = () => {}, // 기존 호환용
  menus, // [{ label, onClick }]
}) {
  const navigate = useNavigate();

  // 기본 메뉴 (기존 동작 유지)
  const defaultMenus = [
    { label: "검색", onClick: () => setActivePanel("search") },
    { label: "주차", onClick: () => setActivePanel("parking") },
    { label: "날씨", onClick: () => setActivePanel("weather") },
    { label: "행사", onClick: () => setActivePanel("event") },
  ];

  const renderMenus = menus && menus.length ? menus : defaultMenus;

  return (
    <div className={styles.sidebar}>
      <Link to="/" className={styles.sidebarIcon}>
        <img src={logoImage} alt="로고" className={styles.sidebarLogo} />
      </Link>

      {renderMenus.map((m, i) => (
        <div key={i} className={styles.sidebarMenu} onClick={m.onClick}>
          {m.label}
        </div>
      ))}

      {mode === "map" ? (
        <Link to={toWhenMap} className={styles.sidebarFooter} title="코스 작성">
          <FaPen size={20} color="white" />
        </Link>
      ) : (
        <button
          type="button"
          className={styles.sidebarFooter}
          title="뒤로가기"
          onClick={() => (onBack ? onBack() : navigate(-1))}
        >
          <FaArrowLeft size={20} color="white" />
        </button>
      )}
    </div>
  );
}

export default Sidebar;
