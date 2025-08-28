// src/components/Location/PlaceCard.jsx
import React from "react";
import styles from "./PlaceCard.module.css";

const simplifyCategory = (raw = "") => {
  const s = String(raw).trim();
  if (!s) return "";
  const t = s.replace(/\s/g, "");
  if (/관광|명소|여행|유적|전망대|랜드마크/.test(t)) return "관광명소";
  if (/카페|디저트/.test(t)) return "카페";
  if (
    /음식|식당|한식|중식|양식|일식|분식|치킨|피자|고기|회|국수|돈까스/.test(t)
  )
    return "음식점";
  if (/숙박|호텔|모텔|펜션|리조트|게스트/.test(t)) return "숙박";
  if (/쇼핑|시장|백화점|아울렛|마트|편의점/.test(t)) return "쇼핑";
  if (/문화|박물관|전시|미술관|공연|도서관|영화관|극장/.test(t))
    return "문화시설";
  if (/공원|자연|산|호수|강|해변|섬|둘레길|산책로|정원/.test(t))
    return "자연/공원";
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
              ♥
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaceCard;
