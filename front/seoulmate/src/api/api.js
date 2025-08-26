// src/api/api.js
import axios from "axios";

// 이걸로 교체
const LOCAL_BASE = "http://localhost:8080";
const PROD_BASE  = "https://seoul-mate.co.kr/contentapi";


const api = axios.create({
  baseURL: LOCAL_BASE,
  withCredentials: false, // content API는 쿠키 안 쓰면 false
});

// 매 요청마다 AT 자동 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

export default api;
