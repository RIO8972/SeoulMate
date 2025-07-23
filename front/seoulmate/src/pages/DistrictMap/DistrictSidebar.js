import React from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logoImage from "../../images/logo.png";
import { FaPen } from "react-icons/fa";

function Sidebar({ setActivePanel }) {
  const navigate = useNavigate();

  return (
    <div className={styles.sidebar}>
      <Link to="/" className={styles.sidebarIcon}>
        <img src={logoImage} alt="로고" className={styles.sidebarLogo} />
      </Link>

      <div
        className={styles.sidebarMenu}
        onClick={() => setActivePanel("search")}
      >
        검색
      </div>
      <div
        className={styles.sidebarMenu}
        onClick={() => setActivePanel("traffic")}
      >
        교통
      </div>
      <div
        className={styles.sidebarMenu}
        onClick={() => setActivePanel("weather")}
      >
        날씨
      </div>
      <div
        className={styles.sidebarMenu}
        onClick={() => setActivePanel("saved")}
      >
        저장
      </div>

      <Link to="/course" className={styles.sidebarFooter} title="코스 작성">
        <FaPen size={20} color="white" />
      </Link>
    </div>
  );
}

export default Sidebar;
