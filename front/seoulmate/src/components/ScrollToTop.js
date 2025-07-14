import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // 페이지 전환 시 맨 위로 스크롤 이동
  }, [pathname]);

  return null;
};

export default ScrollToTop;
