// src/hooks/useLogin.js
import { useState, useCallback } from "react";
import axios from "axios";
import qs from "qs";
import useAccessToken from "./useAccessToken";

export default function useLogin() {
  const { setToken, clearToken } = useAccessToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        "https://seoul-mate.co.kr/auth/login",
        qs.stringify({ email, password }),
        {
          withCredentials: true, // RT 쿠키 수신
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      const accessToken = res.data?.accessToken;
      if (!accessToken) throw new Error(res.data?.message || "아이디/비밀번호를 확인하세요");
      setToken(accessToken); // 저장은 훅이 담당
      return { accessToken };
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  const logout = useCallback(async () => {
    try {
      await axios.post("https://seoul-mate.co.kr/auth/logout", {}, { withCredentials: true });
    } catch { /* 서버 실패는 무시 */ }
    clearToken();
  }, [clearToken]);

  return { login, logout, loading, error };
}
