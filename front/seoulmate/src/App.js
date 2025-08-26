import React, { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import DistrictPage from "./pages/DistrictPage";
import ScrollToTop from "./components/ScrollToTop";
// import MapPage from "./pages/MapPage";
import ReviewForm from "./pages/ReviewForm";
import ReviewEditPage from "./pages/ReviewEditPage";
import ReviewPage from "./pages/ReviewPage";
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

function App() {

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/districts/:regionId" element={<DistrictPage />} />
        <Route
          path="/reviews/:id"
          element={<ReviewDetailPage/>}
        />
        
        <Route path="/reviews/:id/edit" element={<ReviewEditPage />} />

        <Route path="/review/new" element={<ReviewForm />} />
        <Route path="/map/:regionId" element={<DistrictMap />} />
        <Route path="/course/new" element={<CourseCreatePage />} />

        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/courses/:courseId/edit" element={<CourseEditPage />} />
        
        <Route path="/mypage" element={<MyPage />} />
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
