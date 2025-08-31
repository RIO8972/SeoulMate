import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function Logout() {
  const { logout, setAccessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await logout();              // 서버 RT 쿠키/세션 정리 + 상태 null (아래 참고)
      } finally {
        // 방어적: 혹시 모를 잔존값 제거
        try { localStorage.removeItem("accessToken"); } catch {}
        setAccessToken(null);        // Provider 상태도 확실히 null
        navigate("/login", { replace: true });
      }
    })();
  }, [logout, setAccessToken, navigate]);

  return <p>로그아웃 중…</p>;
}