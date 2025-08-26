import React, { useEffect } from "react";
import useRefreshToken from "../../hooks/useRefreshToken"; // 경로는 프로젝트에 맞게 조정

const RequestToken = () => {
  const { refresh, loading, error } = useRefreshToken();

  useEffect(() => {
    (async () => {
      try {
        const token = await refresh();
        console.log("at >>", token);
      } catch (e) {
        // 에러는 훅에서 상태로 노출됨
      }
    })();
  }, [refresh]);

  if (loading) return <div>재발급 중…</div>;
  if (error)   return <div>재발급 실패</div>;
  return <div>재발급 완료</div>;
};

export default RequestToken;