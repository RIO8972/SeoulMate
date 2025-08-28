// src/components/Auth/AuthProvider.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import useAutoRefreshToken from "../../hooks/useAutoRefreshToken";
import { authApi } from "../../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("accessToken")
  );

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

  // ✅ 변경: 서버에 /auth/logout 호출(쿠키 만료는 서버가 Set-Cookie로 처리) + AT 초기화
  const logout = useCallback(async () => {
    try {
      //await authApi.post("/auth/logout", null, { withCredentials: true });
      await axios.post("https://seoul-mate.co.kr/auth/token/logout", null, {
        withCredentials: true,
      });
    } catch (_) {
      // 네트워크 오류여도 클라이언트 상태는 정리
    } finally {
      setAccessToken(null); // -> useEffect가 로컬스토리지/헤더 정리
    }
  }, []);

  const handleRefreshError = useCallback(() => {
    setAccessToken((prev) => (prev ? null : prev));
  }, []);

  useAutoRefreshToken({
    // testAfterIssueSec: 50,
    skewMs: 60_000,
    onRefreshError: handleRefreshError,
    failCooldownMs: 30_000,
  });

  const value = useMemo(
    () => ({
      accessToken,
      login,
      logout,
      setAccessToken,
    }),
    [accessToken, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
