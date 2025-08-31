import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider"; // 추가

function SaveToken() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { setAccessToken, refresh } = useAuth(); // 컨텍스트 사용

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("accessToken");
    console.log("SaveToken search =", search);
    console.log("SaveToken accessToken =", token);

    (async () => {
      if (token) {
        // ✅ Provider 상태 + axios 헤더까지 동기화
        setAccessToken(token);
        navigate("/", { replace: true });
      } else {
        // 토큰이 쿼리에 없으면 RT 쿠키로 갱신 시도 (옵션)
        try {
          await refresh();         // /auth/token/refresh 호출
          navigate("/", { replace: true });
        } catch {
          console.error("토큰이 없습니다. refresh도 실패");
          navigate("/login", { replace: true });
        }
      }
    })();
  }, [search, setAccessToken, refresh, navigate]);

  return <p>로그인 중...</p>;
}

export default SaveToken;