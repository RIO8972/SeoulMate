// src/hooks/useRefreshToken.js
import { useCallback, useState } from "react";
import axios from "axios";

export default function useRefreshToken() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ 요청: 절대 Authorization 헤더 붙지 않도록 명시 + RT 쿠키 포함
      const res = await axios.post(
        "https://seoul-mate.co.kr/auth/token/refresh",
        {},
        {
          withCredentials: true,           // RT 쿠키 전송
          headers: { Authorization: undefined }, // 전역 기본값이 있어도 제거
        }
      );

      const token = res?.data?.accessToken;
      if (!token) throw new Error("재발급 실패: accessToken 없음");

      // ✅ 저장 + 공용 axios 헤더 동기화
      localStorage.setItem("accessToken", token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      return token;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { refresh, loading, error };
}


// import { useCallback, useState } from "react";
// import axios from "axios";
// import { authApi } from "../api/authApi";

// export default function useRefreshToken() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const refresh = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await authApi.post("/auth/token/refresh", {}); // Authorization 없음
//       const token = data?.accessToken;
//       if (!token) throw new Error("재발급 실패: accessToken 없음");

//       // 저장 + axios 공용 헤더 동기화
//       localStorage.setItem("accessToken", token);
//       axios.defaults.headers.common.Authorization = `Bearer ${token}`;
//       return token;
//     } catch (e) {
//       setError(e);
//       throw e;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return { refresh, loading, error };
// }


// import { useCallback, useState } from "react";
// import axios from "axios";

// export default function useRefreshToken() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const refresh = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.post(
//         "https://seoul-mate.co.kr/auth/token/refresh",
//         {},
//         {
//           withCredentials: true,                 // RT 쿠키 전송
//           headers: { Authorization: undefined }, // 이 요청엔 Bearer 제거
//         }
//       );

//       const token = res.data?.accessToken;
//       if (!token) throw new Error("재발급 실패: accessToken 없음");

//       // 저장(요청처럼 localStorage에 저장) + axios 기본 헤더 동기화
//       localStorage.setItem("accessToken", token);
//       axios.defaults.headers.common.Authorization = `Bearer ${token}`;

//       return token;
//     } catch (e) {
//       setError(e);
//       throw e;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return { refresh, loading, error };
// }
