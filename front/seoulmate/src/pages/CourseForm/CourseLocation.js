import React from "react";
import PlaceSelector from "../../components/Location/PlaceSelector";

function CourseLocation({ data, setData }) {
  return <PlaceSelector data={data} setData={setData} />;
}

export default CourseLocation;
