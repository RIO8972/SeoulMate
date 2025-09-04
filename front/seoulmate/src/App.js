// App.jsx
import React from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import DistrictPage from "./pages/DistrictPage";
import ScrollToTop from "./components/ScrollToTop";
import ReviewForm from "./pages/ReviewForm";
import ReviewEditPage from "./pages/ReviewEditPage";
import ReviewDetailPage from "./pages/ReviewDetailPage";
import DistrictMap from "./pages/DistrictMap";
import CourseForm from "./pages/CourseForm";
import CourseEditPage from "./pages/CourseEditPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseCreatePage from "./pages/CourseCreatePage";
import MyPage from "./pages/MyPage";
import RequestToken from "./components/Token/RequestToken";
import Logout from "./components/Auth/Logout";
import SaveToken from "./components/Auth/SaveToken";
import LoginForm from "./components/Auth/LoginForm";
import SignUpForm from "./components/Auth/SignUpForm";
import ProfileEditPage from "./pages/Settings/ProfileEditPage";
import ReviewPage from "./pages/ReviewPage";
import PasswordEditPage from "./pages/Password/PasswordEditPage";
import RequireAuth from "./components/Auth/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/reviews/:id" element={<ReviewDetailPage />} />
          <Route path="/reviews/:id/edit" element={<ReviewEditPage />} />
          <Route path="/review/new" element={<ReviewForm />} />
          <Route path="/course/new" element={<CourseCreatePage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/courses/:courseId/edit" element={<CourseEditPage />} />

          <Route path="/mypage" element={<MyPage />} />
          <Route path="/settings" element={<ProfileEditPage />} />
          <Route path="/settings/password" element={<PasswordEditPage />} />
        </Route>

        <Route path="/" element={<Home />} />
        {/* 기본: 지도 먼저 */}
        <Route path="/map/:regionId" element={<DistrictMap />} />
        <Route path="/reviews" element={<ReviewPage />} />

        {/* 리스트 페이지 */}
        <Route path="/districts/:regionId" element={<DistrictPage />} />
        {/* 예전 경로로 오면 지도로 리다이렉트 */}
        <Route
          path="/district/:regionId"
          element={<Navigate to="/map/:regionId" replace />}
        />
        <Route
          path="/region/:regionId"
          element={<Navigate to="/map/:regionId" replace />}
        />



        <Route path="/login" element={<LoginForm />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/savetoken" element={<SaveToken />} />
        <Route path="/requesttoken" element={<RequestToken />} />
        <Route path="/sign" element={<SignUpForm />} />

      </Routes>
    </BrowserRouter>
  );
}
