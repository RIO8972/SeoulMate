import axios from "axios";

export const authApi = axios.create({
  baseURL: "https://seoul-mate.co.kr",
  withCredentials: true, // RT 쿠키 전송
});

// 방어적으로 제거
delete authApi.defaults.headers.common?.Authorization;

// 이 인스턴스에는 Authorization 절대 금지
authApi.interceptors.request.use((config) => {
  if (config.headers) delete config.headers.Authorization;
  return config;
});

