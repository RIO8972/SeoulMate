// src/pages/Settings/ProfileEditPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ProfileEditPage.module.css";
import api from "../../api/api";
import Header from "../../components/Header";

// ✅ 기본 프로필 이미지 (너가 가진 파일 경로)
import defaultAvatar from "../../images/account.png";
const DEFAULT_AVATAR = defaultAvatar;

export default function ProfileEditPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // 서버 원본
  const [me, setMe] = useState(null);

  // 수정 상태
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);

  const fileInputRef = useRef(null);

  // ───────────────── 초기 로드: 내 정보 가져오기 ─────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/me");
        if (!mounted) return;
        const u = res.data ?? {};
        setMe(u);
        setNickname(u.nickname ?? u.name ?? "");
        setEmail(u.email ?? "");
        // ✅ 서버가 이미지 안 주면 기본 이미지로
        setAvatarPreview(u.avatarUrl ?? u.profileImage ?? DEFAULT_AVATAR);
      } catch (e) {
        console.error("내 정보 조회 실패", e);
        if (e?.response?.status === 401) {
          localStorage.removeItem("accessToken");
        }
        setError("내 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (avatarPreview?.startsWith?.("blob:"))
        URL.revokeObjectURL(avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 변경 여부 → 저장 버튼 활성화
  const isDirty = useMemo(() => {
    const baseNick = me?.nickname ?? me?.name ?? "";
    return nickname.trim() !== baseNick || !!avatarFile;
  }, [me, nickname, avatarFile]);

  // ───────────────── 파일 선택/검사/미리보기 ─────────────────
  const validateImage = (file) => {
    if (!file?.type?.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 해요.");
      return false;
    }
    return true;
  };

  const handleFileFromUser = (file) => {
    if (!file || !validateImage(file)) return;
    setAvatarFile(file);
    if (avatarPreview?.startsWith?.("blob:"))
      URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onFileChange = (e) => handleFileFromUser(e.target.files?.[0]);
  const pickFile = () => fileInputRef.current?.click();

  // ───────────────── 기본 이미지로(삭제) ─────────────────
  const handleRemoveAvatar = async () => {
    if (!window.confirm("프로필 사진을 기본 이미지로 변경할까요?")) return;
    try {
      setUploading(true);
      await api.delete("/users/me/avatar"); // 팀 엔드포인트명 맞추기
      const refreshed = await api.get("/users/me");
      setMe(refreshed.data ?? {});
      setAvatarFile(null);
      if (avatarPreview?.startsWith?.("blob:"))
        URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(DEFAULT_AVATAR); // ✅ 바로 기본 이미지로
      window.dispatchEvent(new Event("profile-updated"));
    } catch (e) {
      console.error(e);
      alert("이미지 삭제에 실패했어요.");
    } finally {
      setUploading(false);
    }
  };

  // ───────────────── 저장 ─────────────────
  const handleSave = async () => {
    if (!isDirty) return;
    try {
      setSaving(true);
      setError("");

      // 닉네임 변경 (필요시)
      const baseNick = me?.nickname ?? me?.name ?? "";
      if (nickname.trim() !== baseNick) {
        await api.put("/users/me", { nickname: nickname.trim() });
      }

      // 아바타 업로드 (필요시)
      if (avatarFile) {
        const form = new FormData();
        form.append("file", avatarFile);
        await api.post("/users/me/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 최신 상태 동기화
      const refreshed = await api.get("/users/me");
      setMe(refreshed.data ?? {});
      setNickname(refreshed.data?.nickname ?? refreshed.data?.name ?? "");
      setAvatarFile(null);
      if (avatarPreview?.startsWith?.("blob:"))
        URL.revokeObjectURL(avatarPreview);

      // ✅ 서버 URL이 있으면 캐시버스트, 없으면 기본 이미지
      const serverUrl =
        refreshed.data?.avatarUrl ?? refreshed.data?.profileImage ?? "";
      setAvatarPreview(
        serverUrl ? `${serverUrl}?t=${Date.now()}` : DEFAULT_AVATAR
      );

      alert("저장되었습니다.");
      window.dispatchEvent(new Event("profile-updated"));
    } catch (e) {
      console.error(e);
      setError("저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.page}>
          <div className={styles.cover} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.page}>
        {/* 상단 커버 */}
        <div className={styles.cover}>
          <div className={styles.coverInner}>
            {/* 표시 전용 */}
            <div className={styles.avatarWrap}>
              <div
                className={styles.profileBtn}
                role="img"
                aria-label="프로필 사진"
              >
                {/* ✅ 항상 img 사용 (기본 이미지를 포함해) */}
                <img
                  src={avatarPreview || DEFAULT_AVATAR}
                  alt="avatar"
                  className={styles.profileImg}
                />
              </div>
            </div>

            <div className={styles.ownerName}>
              {nickname || me?.name || "사용자"}
            </div>

            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.smallSecondary}
                onClick={pickFile}
                disabled={uploading || saving}
              >
                사진 선택
              </button>
              <button
                type="button"
                className={styles.smallSecondary}
                onClick={handleRemoveAvatar}
                disabled={uploading || saving}
              >
                기본 이미지로
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className={styles.hiddenFile}
                onChange={onFileChange}
              />
            </div>
          </div>
        </div>

        {/* 본문 카드 */}
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>프로필 설정</h2>

          <div className={styles.formCard}>
            <label className={styles.label}>닉네임</label>
            <input
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              maxLength={20}
              disabled={saving}
            />

            <label className={styles.label}>이메일</label>
            <input
              className={styles.input}
              value={email}
              disabled
              readOnly
              placeholder="email"
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
                onClick={handleSave}
                disabled={saving || !isDirty}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>

            <div className={styles.divider} />
            <div className={styles.footerDanger}>
              <button
                type="button"
                className={styles.dangerGhost}
                onClick={async () => {
                  if (!window.confirm("정말 회원탈퇴 하시겠어요?")) return;
                  try {
                    await api.delete("/users/me"); // 팀 엔드포인트에 맞게 수정
                    localStorage.removeItem("accessToken");
                    window.location.replace("/goodbye");
                  } catch (e) {
                    alert("탈퇴 처리에 실패했어요.");
                  }
                }}
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
