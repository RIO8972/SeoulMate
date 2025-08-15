import React, { useState } from "react";
import PlaceSelector from "../../../components/Location/PlaceSelector";

function StepLocation({ data, setData }) {
  return <PlaceSelector data={data} setData={setData} />;
}

export default StepLocation;
