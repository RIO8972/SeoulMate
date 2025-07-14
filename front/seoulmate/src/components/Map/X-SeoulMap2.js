// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "./SeoulMap2.css";
// import backgroundImage from "../images/seoul-background.png";
// import regions from "./regions"; // 상대 경로로 잘 맞춰야 함

// const SeoulMap2 = () => {
//   const navigate = useNavigate();
//   const handleClick = (path) => {
//     navigate(path);
//   };

//   return (
//     <div className="map-layout">
//       <div className="map-wrapper">
//         <img src={backgroundImage} alt="Seoul Map" className="map-background" />
//         {regions.map((region, index) => (
//           <div
//             key={index}
//             className="region"
//             style={{ top: region.top, left: region.left }}
//             onClick={() => handleClick(region.path)}
//           >
//             <img
//               src={region.icon}
//               alt={region.name}
//               style={{ width: region.width, height: region.height }}
//             />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default SeoulMap2;
