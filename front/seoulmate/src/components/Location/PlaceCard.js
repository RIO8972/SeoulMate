// src/components/Location/PlaceCard.jsx
import React from "react";
import styles from "./PlaceCard.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";

const simplifyCategory = (raw = "") => {
  const s = String(raw || "").trim();
  if (!s) return "";

  // 토큰화: 구분자 단위로 쪼개서 정확히 비교
  const tokens = s
    .replace(/\s+/g, "")
    .split(/>|,|\/|·|\(|\)|＆|&/g)
    .filter(Boolean);

  const has = (...keys) => tokens.some(t => keys.includes(t));

  if (has("관광","명소","여행","유적","전망대","랜드마크")) return "관광명소";
  if (has("카페","디저트")) return "카페";
  if (has("음식","음식점","식당","한식","중식","양식","일식","분식","치킨","피자","고기","국수","돈까스","횟집","초밥","스시","해산물")) return "음식점";
  if (has("숙박","호텔","모텔","펜션","리조트","게스트하우스","게스트")) return "숙박";
  if (has("쇼핑","시장","백화점","아울렛","마트","편의점")) return "쇼핑";
  if (has("문화","박물관","전시","미술관","공연","도서관","영화관","극장")) return "문화시설";
  if (has("공원","자연","산","호수","강","해변","섬","둘레길","산책로","정원")) return "자연/공원";

  // 매칭 안 되면 상위 카테고리(> 앞) 또는 '기타'
  return s.split(">").shift()?.trim() ?? "기타";
};

function PlaceCard({
  place,
  onAdd, // select 모드에서 사용
  mode = "select", // 'select' | 'browse'
  isWishlisted = false, // browse 모드에서 사용
  onToggleWishlist, // browse 모드에서 사용 (place, next)
}) {
  const categoryRaw =
    place.category || place.category_group_name || place.category_name || "";
  const category = simplifyCategory(categoryRaw);
  const address =
    place.address || place.road_address_name || place.address_name || "";

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.text}>
          <h4 className={styles.name}>{place.name}</h4>
          <div className={styles.sub}>
            {category && <span className={styles.category}>{category}</span>}
            {category && address && <span className={styles.dot}>·</span>}
            {address && <span className={styles.address}>{address}</span>}
          </div>
        </div>

        <div className={styles.actions}>
          {mode === "select" ? (
            <button className={styles.addButton} onClick={() => onAdd?.(place)}>
              + 추가
            </button>
          ) : (
            <button
              className={`${styles.wishButton} ${
                isWishlisted ? styles.active : ""
              }`}
              aria-pressed={isWishlisted}
              title={isWishlisted ? "관심 해제" : "관심 등록"}
              onClick={() => onToggleWishlist?.(place, !isWishlisted)}
            >
              <FontAwesomeIcon
                icon={isWishlisted ? solidHeart : regularHeart}
                style={{ color: isWishlisted ? "#e74c3c" : "#999" }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaceCard;
