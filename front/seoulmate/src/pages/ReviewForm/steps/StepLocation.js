import React, { useState } from "react";
import PlaceSelector from "../../../components/Location/PlaceSelector";

function StepLocation({ data, setData }) {
  const [reviewPlaces, setReviewPlaces] = useState([]);

  return (
    <PlaceSelector
      selectedPlaces={reviewPlaces}
      setSelectedPlaces={(places) => {
        setReviewPlaces(places);
        setData((prev) => ({ ...prev, places: places }));
      }}
    />
  );
}

export default StepLocation;
