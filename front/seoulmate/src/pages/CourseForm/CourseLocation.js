import React, { useState } from "react";
import PlaceSelector from "../../components/Location/PlaceSelector";

function CourseLocation({ data, setData }) {
  const [coursePlaces, setCoursePlaces] = useState([]); //

  return (
    <PlaceSelector
      selectedPlaces={coursePlaces}
      setSelectedPlaces={(places) => {
        setCoursePlaces(places); //
        setData((prev) => ({ ...prev, coursePlaces: places }));
      }}
    />
  );
}

export default CourseLocation;
