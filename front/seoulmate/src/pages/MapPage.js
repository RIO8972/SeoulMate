import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const MapPage = () => {
  const { regionCode } = useParams();
  const [city, setCity] = useState({});
  useEffect(() => {
    axios
      .get(
        "https://seoul-mate.co.kr/cityapi/cache/regions/city/districts/" +
          regionCode,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log("region_data", res.data);
        setCity(res.data);
      })
      .catch(console.error);
  }, []);

  // 아직 데이터가 없을 때
  if (city === null) {
    return <div>로딩 중…</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Raw JSON 데이터</h2>
      <pre
        style={{
          background: "#f5f5f5",
          padding: 16,
          borderRadius: 4,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {JSON.stringify(city, null, 2)}
      </pre>
    </div>
  );
};
export default MapPage;
