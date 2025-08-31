import { useState } from "react";
import { useParams } from "react-router-dom";
import { FaMap, FaListUl } from "react-icons/fa";
import DistrictMap from "../DistrictMap"; // ← 기존 지도 페이지 경로
import DistrictPage from "../DistrictPage"; // ← 너가 준 리스트 페이지
import "./style.css";

export default function DistrictExplore() {
  const { regionId } = useParams();
  const [mode, setMode] = useState("map"); // 'map' | 'list'

  return (
    <div className="dxp-wrap">
      {/* 상단 중앙 토글 버튼 */}
      <div className="dxp-toggle" role="group" aria-label="보기 전환">
        <button
          type="button"
          className={`dxp-btn ${mode === "map" ? "is-active" : ""}`}
          onClick={() => setMode("map")}
          aria-pressed={mode === "map"}
        >
          <FaMap className="dxp-ic" />
          지도로 보기
        </button>
        <button
          type="button"
          className={`dxp-btn ${mode === "list" ? "is-active" : ""}`}
          onClick={() => setMode("list")}
          aria-pressed={mode === "list"}
        >
          <FaListUl className="dxp-ic" />
          리스트로 보기
        </button>
      </div>

      {/* 컨텐츠: 지도 or 리스트 */}
      <div className="dxp-body">
        {mode === "map" ? (
          // 기존 DistrictMap은 내부에서 useParams를 쓰므로 그냥 렌더만 해도 됨
          <DistrictMap />
        ) : (
          // DistrictPage가 Header를 포함한다면 그대로 렌더 (아래 2) 참고)
          <DistrictPage />
        )}
      </div>
    </div>
  );
}
