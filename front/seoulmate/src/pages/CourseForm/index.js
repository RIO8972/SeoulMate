import React, { useState } from "react";
import CourseLocation from "./CourseLocation";
import Sidebar from "../../components/Sidebar"; // ⬅️ 재사용 사이드바
import "./style.css";

function CourseForm() {
  const [formData, setFormData] = useState({
    coursePlaces: [],
    title: "",
    description: "",
    cost: 0,
  });

  return (
    <div className="course-form-layout">
      {/* 왼쪽 사이드바 (뒤로가기 버튼 모드) */}
      <Sidebar
        mode="course"
        menus={[
          { label: "리뷰", onClick: () => console.log("리뷰 패널 열기") },
        ]}
      />

      {/* 오른쪽 메인 작성 영역 */}
      <div className="course-form-container">
        <div className="course-form-header">
          <h1 className="course-form-title">🗺️ 코스 작성</h1>
          <p className="course-form-subtitle">
            데이트 코스를 직접 만들어보세요
          </p>
        </div>

        <CourseLocation data={formData} setData={setFormData} />
      </div>
    </div>
  );
}

export default CourseForm;
