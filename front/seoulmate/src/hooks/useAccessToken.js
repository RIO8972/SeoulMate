// src/hooks/useAccessToken.js
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const STORAGE_KEY = "accessToken";

export default function useAccessToken() {
  const [token, setTokenState] = useState(() => {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t) axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    return t;
  });

  // 다른 탭에서 로그인/로그아웃해도 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setTokenState(e.newValue);
        if (e.newValue) {
          axios.defaults.headers.common.Authorization = `Bearer ${e.newValue}`;
        } else {
          delete axios.defaults.headers.common.Authorization;
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setToken = useCallback((t) => {
    if (!t) return clearToken();
    localStorage.setItem(STORAGE_KEY, t);
    setTokenState(t);
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTokenState(null);
    delete axios.defaults.headers.common.Authorization;
  }, []);

  return { token, setToken, clearToken };
}
