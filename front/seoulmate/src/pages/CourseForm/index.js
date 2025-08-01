import React, { useState } from "react";
import CourseLocation from "./CourseLocation";
import "./style.css";
import Header from "../../components/Header";

function CourseForm() {
  const [formData, setFormData] = useState({
    coursePlaces: [],
    title: "",
    description: "",
    cost: 0,
  });

  return (
    <div className="course-form-container">
      <Header />
      <div className="course-form-header">
        <h1 className="course-form-title">🗺️ 코스 작성</h1>
        <p className="course-form-subtitle">데이트 코스를 직접 만들어보세요</p>
      </div>

      <CourseLocation data={formData} setData={setFormData} />
    </div>
  );
}

export default CourseForm;
