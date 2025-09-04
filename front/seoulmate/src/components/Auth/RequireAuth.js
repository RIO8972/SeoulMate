// src/routes/RequireAuth.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

function hasToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN")
  );
}

export default function RequireAuth() {
  const location = useLocation();
  if (!hasToken()) {
    // 로그인 후 돌아올 위치 기억
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />; // 통과
}
