// src/auth/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function Logout() {
  const { logout, setAccessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1) 로컬 상태/스토리지 즉시 정리
    try { localStorage.removeItem("accessToken"); } catch {}
    setAccessToken(null);

    // 2) 서버 로그아웃은 화면 전환을 막지 않도록 fire-and-forget
    Promise.resolve().then(() => logout().catch(() => {}));

    // 3) 즉시 로그인 페이지로 이동
    navigate("/login", { replace: true });
  }, [logout, setAccessToken, navigate]);

  return null; // "로그아웃 중…" 같은 문구 없이 바로 이동
}
