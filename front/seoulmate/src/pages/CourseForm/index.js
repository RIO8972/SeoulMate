import React, { useState } from "react";
import CourseLocation from "./CourseLocation";

function CourseForm() {
  const [formData, setFormData] = useState({
    coursePlaces: [],
    title: "",
    description: "",
    cost: 0,
  });

  return (
    <div>
      <h2>코스 작성</h2>
      <CourseLocation data={formData} setData={setFormData} />
    </div>
  );
}

export default CourseForm;
