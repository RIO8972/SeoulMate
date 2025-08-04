import React, { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
//import Login from "./pages/Login";
import DistrictPage from "./pages/DistrictPage";
import ReviewPage from "./pages/ReviewPage";
import ReviewDetail from "./pages/ReviewDetailPage";
import ScrollToTop from "./components/ScrollToTop";
import MapPage from "./pages/MapPage";
import ReviewForm from "./pages/ReviewForm";
import DistrictMap from "./pages/DistrictMap";
import CourseForm from "./pages/CourseForm";

import RequestToken from "./components/Token/RequestToken";
import Logout from "./components/Auth/Logout";
import SaveToken from "./components/Auth/SaveToken";
import LoginForm from "./components/Auth/LoginForm";

import SignUpForm from "./components/Auth/SignUpForm";

function App() {
  // 임시 데이터
  const [reviews] = useState([
    {
      id: 1,
      title: "카페☕",
      region: "용산구",
      image: "/images/test/cafe1.jpg",
      images: [
        "/images/test/cafe1.jpg",
        "/images/test/cafe2.jpg",
        "/images/test/cafe3.jpg",
        "/images/test/cafe4.jpg",
        "/images/test/cafe5.jpg",
      ],
      visitedDate: "2025.05.01",
      createdAt: "2025.05.03",
      cost: "10,000원",
      like: 900,
      keyword: "맛집 · 디저트",
      description: "여유로운 카페에서 디저트를 즐기는 코스입니다.",
      tips: "브런치 시간대는 붐비니 오픈 직후 추천!",
      course: [{ place: "로맨틱카페", category: "카페", time: "60분" }],
    },
    {
      id: 2,
      title: "한강 야경 명소",
      region: "영등포구",
      image: "/images/test/night1.jpg",
      images: [
        "/images/test/night1.jpg",
        "/images/test/night2.jpg",
        "/images/test/night3.jpg",
        "/images/test/night4.jpg",
        "/images/test/night.jpg",
      ],
      visitedDate: "2025.03.01",
      createdAt: "2025.03.03",
      cost: "20,000원",
      like: 800,
      keyword: "야경 · 감성",
      description:
        "한강의 반짝이는 야경과 도시의 불빛을 감상하며, 여유롭게 산책을 즐길 수 있는 코스입니다. 강바람을 맞으며 걷거나 근처 벤치에서 도란도란 이야기 나누기에도 좋아요. 분위기 좋은 카페에서 따뜻한 음료 한 잔과 함께 야경을 바라보며 잊지 못할 추억을 만들어보세요.",
      tips: `- 야경 명소로는 반포대교, 여의도 한강공원, 망원 한강공원 등이 인기입니다.
- 인파가 많은 시간(주말, 저녁 8~10시)을 피해 평일 밤이나 늦은 저녁에 방문하면 더 한적하게 즐길 수 있습니다.
- 돗자리와 간단한 간식, 담요를 준비해 가면 더욱 아늑한 시간을 보낼 수 있어요.
- 멋진 야경을 사진으로 남기고 싶다면 삼각대와 스마트폰 카메라의 야간 모드를 활용해 보세요.
- 근처에 자전거 대여소가 많으니, 커플 자전거로 한강을 따라 라이딩하는 것도 추천합니다!
`,
      course: [
        { place: "한강공원", category: "명소", time: "60분" },
        { place: "동작노을카페", category: "카페", time: "90분" },
        { place: "카페", category: "카페", time: "40분" },
      ],
    },
    {
      id: 3,
      title: "서울숲 데이트",
      region: "성동구",
      image: "/images/test/forest1.jpg",
      images: [
        "/images/test/forest1.jpg",
        "/images/test/forest2.jpg",
        "/images/test/forest3.jpg",
        "/images/test/forest4.jpg",
        "/images/test/forest5.jpg",
      ],
      visitedDate: "2025.04.01",
      createdAt: "2025.04.03",
      cost: "30,000원",
      like: 700,
      keyword: "자연 · 산책",
      description: "서울숲과 인근 카페를 거니는 코스입니다.",
      tips: "봄철 벚꽃 시즌에 특히 추천해요.",
      course: [
        { place: "서울숲", category: "공원", time: "60분" },
        { place: "감성카페", category: "카페", time: "90분" },
      ],
    },
    {
      id: 4,
      title: "데이트4",
      region: "마포구",
      image: "/images/test/date1.jpg",
      images: [
        "/images/test/date1.jpg",
        "/images/test/date2.jpg",
        "/images/test/date3.jpg",
        "/images/test/date4.jpg",
        "/images/test/date5.jpg",
      ],
      visitedDate: "2025.02.01",
      createdAt: "2025.02.03",
      cost: "40,000원",
      like: 600,
      keyword: "맛집 · 디저트",
    },
    {
      id: 5,
      title: "데이트5",
      region: "서대문구",
      image: "/images/test/date2.jpg",
      visitedDate: "2025.01.01",
      createdAt: "2025.01.03",
      cost: "50,000원",
      like: 50,
      keyword: "맛집 · 디저트",
    },
    {
      id: 6,
      title: "데이트6",
      region: "구로구",
      image: "/images/test/date3.jpg",
      visitedDate: "2025.03.05",
      createdAt: "2025.03.05",
      cost: "60,000원",
      like: 60,
      keyword: "맛집 · 디저트",
    },
    {
      id: 7,
      title: "데이트7",
      region: "강서구",
      image: "/images/test/date4.jpg",
      visitedDate: "2025.05.05",
      createdAt: "2025.05.08",
      cost: "70,000원",
      like: 70,
      keyword: "야경",
    },
    {
      id: 8,
      title: "데이트8",
      region: "관악구",
      image: "/images/test/date5.jpg",
      visitedDate: "2025.05.10",
      createdAt: "2025.05.11",
      cost: "80,000원",
      like: 0,
      keyword: "맛집",
    },
  ]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home reviews={reviews} />} />

        <Route path="/districts/:regionId" element={<DistrictPage />} />
        <Route path="/reviews" element={<ReviewPage reviews={reviews} />} />
        {/* <Route path="/map/:regionCode" element={<MapPage />} /> */}
        <Route
          path="/review/:id"
          element={<ReviewDetail reviews={reviews} />}
        />
        <Route path="/review/new" element={<ReviewForm />} />
        <Route path="/map/:regionId" element={<DistrictMap />} />
        <Route path="/course" element={<CourseForm />} />

        <Route path="/login" element={<LoginForm />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/savetoken" element={<SaveToken />} />
        <Route path="/requesttoken" element={<RequestToken />} />

        <Route path="/sign" element={<SignUpForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
