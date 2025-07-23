import React, { useEffect, useState } from "react";
import styles from "./SidePanel.module.css";

function SidePanel({ title, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    return () => setVisible(false); // cleanup
  }, []);

  const handleClose = () => {
    setVisible(false);

    // 애니메이션 시간(300ms) 후에 onClose 실행
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`${styles.panel} ${
        visible ? styles.slideIn : styles.slideOut
      }`}
    >
      <button className={styles.closeButton} onClick={handleClose}>
        ×
      </button>
      <h2 className={styles.panelTitle}>{title}</h2>
      <div className={styles.content}>
        {title}에 대한 내용을 여기에 표시합니다.
      </div>
    </div>
  );
}

export default SidePanel;
