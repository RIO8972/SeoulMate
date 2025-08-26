// src/components/Auth/AuthProvider.js
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import useAutoRefreshToken from "../../hooks/useAutoRefreshToken";
import { authApi } from "../../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken"));

  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      localStorage.setItem("accessToken", accessToken);
    } else {
      delete axios.defaults.headers.common.Authorization;
      localStorage.removeItem("accessToken");
    }
  }, [accessToken]);

  const login = useCallback(async (email, password) => {
    const qs = new URLSearchParams({ email, password }).toString();
    const res = await axios.post("https://seoul-mate.co.kr/auth/login", qs, {
      withCredentials: true,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const token = res.data?.accessToken;
    if (!token) throw new Error(res.data?.message || "accessToken이 없습니다.");
    setAccessToken(token);
    return token;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.post("/auth/logout", {}); } catch {}
    setAccessToken(null);
  }, []);

  // ❗️안정 레퍼런스로 에러 핸들러 생성 (렌더마다 새 함수 금지)
  const handleRefreshError = useCallback(() => {
    setAccessToken((prev) => (prev ? null : prev));
  }, []);

  // 자동 재발급: 테스트면 testAfterIssueSec, 프로덕션이면 skewMs 사용
  useAutoRefreshToken({
    //testAfterIssueSec: 50,
    skewMs: 60_000,
    onRefreshError: handleRefreshError,
    failCooldownMs: 30_000, // 실패 후 30초 쿨다운
  });

  const value = useMemo(() => ({
    accessToken, login, logout, setAccessToken,
  }), [accessToken, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
// import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
// import axios from "axios";
// import useAutoRefreshToken from "../../hooks/useAutoRefreshToken";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken"));

//   useEffect(() => {
//     if (accessToken) {
//       axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
//       localStorage.setItem("accessToken", accessToken);
//     } else {
//       delete axios.defaults.headers.common.Authorization;
//       localStorage.removeItem("accessToken");
//     }
//   }, [accessToken]);

//   const login = useCallback(async (email, password) => {
//     const qs = new URLSearchParams({ email, password }).toString();
//     const res = await axios.post("https://seoul-mate.co.kr/auth/login", qs, {
//       withCredentials: true,
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     });
//     const token = res.data?.accessToken;
//     if (!token) throw new Error(res.data?.message || "accessToken이 없습니다.");
//     setAccessToken(token);
//     return token;
//   }, []);

//   // 변경: 서버 로그아웃 호출 + 쿠키(리프레시) 만료, 그 다음 로컬 정리
//   const logout = useCallback(async () => {
//     try {
//       await axios.post("https://seoul-mate.co.kr/auth/logout", null, {
//         withCredentials: true, // httpOnly RT 쿠키 제거 위해 필수
//       });
//     } catch (_) {
//       // 서버가 없거나 실패해도 아래 로컬 정리는 계속 진행
//     }
//     setAccessToken(null);
//     try { localStorage.removeItem("accessToken"); } catch {}
//     delete axios.defaults.headers.common.Authorization;
//   }, []);

//   const handleRefreshError = useCallback(() => {
//     setAccessToken((prev) => (prev ? null : prev));
//   }, []);

//   // ✅ 변경: accessToken 없을 땐 자동 재발급 훅 비활성화
//   useAutoRefreshToken({
//     enabled: !!accessToken,   // <-- 이 한 줄이 핵심
//     skewMs: 60_000,
//     onRefreshError: handleRefreshError,
//     failCooldownMs: 30_000,
//   });

//   const value = useMemo(() => ({
//     accessToken, login, logout, setAccessToken,
//   }), [accessToken, login, logout]);

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => useContext(AuthContext);
