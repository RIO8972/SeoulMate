
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';   // named import으로 변경

export function isTokenValid() {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token);   // 이제 jwtDecode를 직접 사용 가능
    const now = Date.now() / 1000;
    return exp > now;
  } catch (e) {
    console.error('토큰 디코딩 오류', e);
    return false;
  }
}

const RequireAuth = ({ children }) => {
  const location = useLocation();

  if (!isTokenValid()) {
    console.error('토큰만료.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 토큰 유효하면 그냥 children 렌더링
  return children;
};

export default RequireAuth;
