import React, { useState } from "react";
import PlaceSelector from "../../../components/Location/PlaceSelector";

function StepLocation({
  data,
  setData,
  defaultKeyword,
  defaultPlace,
  className,
}) {
  return (
    <PlaceSelector
      data={data}
      setData={setData}
      defaultKeyword={defaultKeyword}
      defaultPlace={defaultPlace}
      className={className}
    />
  );
}

export default StepLocation;
