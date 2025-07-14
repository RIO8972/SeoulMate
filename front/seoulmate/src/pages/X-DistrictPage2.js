// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";

// const DistrictPage = () => {
//   const { regionName } = useParams(); // URL에서 /region/:regionName 가져오기
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     axios
//       .get(
//         "http://ec2-3-37-40-220.ap-northeast-2.compute.amazonaws.com/cityapi/search/seoul?region=고척돔"
//       )
//       .then((res) => {
//         setData(res.data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("API 호출 실패:", err);
//         setLoading(false);
//       });
//   }, [regionName]);

//   return (
//     <div>
//       <h1>{regionName} 혼잡도 정보</h1>
//       {loading ? (
//         <p>로딩 중...</p>
//       ) : data ? (
//         <pre>{JSON.stringify(data, null, 2)}</pre>
//       ) : (
//         <p>데이터를 불러오지 못했습니다.</p>
//       )}
//     </div>
//   );
// };

// export default DistrictPage;
