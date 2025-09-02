// src/pages/Settings/PasswordEditPage.jsx
import { useEffect, useState } from "react";
import styles from "./PasswordEditPage.module.css";
import axios from "axios";
import Header from "../../components/Header";
import defaultAvatar from "../../images/account.png";

export default function PasswordEditPage() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      alert("현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.");
      return;
    }
    if (newPwd.length < 8) {
      alert("새 비밀번호는 8자 이상이어야 해요.");
      return;
    }

    try {
      setChangingPwd(true);
      setError("");

      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("ACCESS_TOKEN") ||
        "";

      const res = await axios.patch(
        "https://seoul-mate.co.kr/auth/auth/password/change",
        {
          currentPassword: currentPwd,
          newPassword: newPwd,
          confirmNewPassword: newPwd,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      alert(res.data?.message || "비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
      setCurrentPwd("");
      setNewPwd("");
      window.location.replace("/logout");
    } catch (e) {
      console.error("비밀번호 변경 실패", e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "비밀번호 변경에 실패했어요.";
      setError(msg);
      alert(msg);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.cover}>
          <div className={styles.coverInner}>
            <div className={styles.avatarWrap}>
            </div>
          </div>
        </div>

        {/* 본문: 비밀번호 변경 폼 */}
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>비밀번호 변경</h2>

          <div className={styles.formCard}>
            <label className={styles.label}>현재 비밀번호</label>
            <input
              type="password"
              className={styles.input}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
              disabled={changingPwd}
            />

            <label className={styles.label}>새 비밀번호</label>
            <input
              type="password"
              className={styles.input}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
              autoComplete="new-password"
              disabled={changingPwd}
            />

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
                <button
                type="button"
                className={styles.secondary}
                onClick={() => window.history.back()}
              >
                돌아가기
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={handleChangePassword}
                disabled={changingPwd || !currentPwd || !newPwd}
              >
                {changingPwd ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
