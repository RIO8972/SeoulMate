import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCreditCard } from "@fortawesome/free-regular-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";
import api from "../../../api/api";

/* 날짜 포맷터: YYYY.MM.DD */
const fmtYmd = (val) => {
  if (!val) return "";
  const s = String(val);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}.${mo}.${dd}`;
};
/* 시간 포맷터: HH:mm */
const fmtHm = (val) => {
  if (!val) return "";
  const s = String(val);
  const m = s.match(/T?(\d{2}:\d{2})/);
  return m ? m[1] : s.slice(0, 5);
};
const fmtCost = (v) => {
  const digits = String(v ?? "").replace(/[^\d.-]/g, "");
  const n = digits === "" ? 0 : Number(digits);
  return Number.isFinite(n) ? n.toLocaleString() : "";
};

/* JWT payload 디코더 (base64url) */
const decodeJwtPayload = (token) => {
  try {
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/* ── 리뷰 태그 이모지 매핑 ── */
const TAG_ICON_MAP = {
  맛집: "🌟",
  음식점: "🍽️",
  카페: "☕",
  디저트: "🍰",
  자연: "🌲",
  산책: "🚶🏻‍♂️",
  야경: "🌃",
  감성: "✨",
  명소: "📍",
  힐링: "🍵",
  쇼핑: "🛍️",
  실내: "🛋️",
  전시: "🖼️",
  팝업: "🏬",
  공연: "🎫",
  영화관: "🎞️",
  액티비티: "🎯",
  드라이브: "🚗",
};

/* 배열/문자열 어떤 형태든 ["맛집","디저트", ...]로 정규화 */
const normalizeReviewTags = (review) => {
  if (Array.isArray(review?.categories) && review.categories.length) {
    return review.categories
      .map((c) => (typeof c === "string" ? c : c?.label || c?.name || ""))
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  const raw = String(review?.keyword ?? review?.keywords ?? "").trim();
  if (!raw) return [];
  const plain = raw.replace(/^#\s*/, "");
  return plain
    .split(/[\s·,|/]+/)
    .map((x) => x.trim())
    .filter(Boolean);
};

/* ───────────────── Kakao 미니맵 ───────────────── */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function buildPopupBox(title, rows = []) {
  const box = document.createElement("div");
  box.className = "mapPopup";
  box.innerHTML = `
    <button class="mapPopup__close" aria-label="닫기">×</button>
    <strong class="mapPopup__title">${esc(title || "")}</strong>
    <div class="mapPopup__content">
      ${rows
        .map(
          (r) => `
        <div class="mapPopup__row">
          <span class="mapPopup__label">${esc(r.label || "")}</span>
          <span class="mapPopup__value">${
            r?.valueHtml != null ? r.valueHtml : esc(r?.value || "")
          }</span>
        </div>`
        )
        .join("")}
    </div>
  `;
  return box;
}
function openOverlay(map, overlayRef, position, box) {
  if (overlayRef.current) {
    overlayRef.current.setMap(null);
    overlayRef.current = null;
  }
  const overlay = new window.kakao.maps.CustomOverlay({
    content: box,
    position,
    xAnchor: 0.5,
    yAnchor: 1,
    zIndex: 3,
  });
  overlay.setMap(map);
  overlayRef.current = overlay;
  const closeBtn = box.querySelector(".mapPopup__close");
  if (closeBtn) {
    closeBtn.onclick = () => {
      overlay.setMap(null);
      if (overlayRef.current === overlay) overlayRef.current = null;
    };
  }
}
function KakaoMiniMap({ places = [], height = 300 }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const markersRef = useRef([]);

  const loadKakao = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.kakao?.maps) return resolve(window.kakao);
      const id = "kakao-maps-sdk";
      const exist = document.getElementById(id);
      if (exist) {
        exist.addEventListener("load", () => resolve(window.kakao));
        exist.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_KEY}&autoload=false`;
      s.onload = () => resolve(window.kakao);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }, []);

  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      if (!containerRef.current) return;
      const kakao = await loadKakao();
      kakao.maps.load(() => {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
          overlayRef.current = null;
        }

        const pts = (Array.isArray(places) ? places : [])
          .map((p) => {
            const lat = parseFloat(p.lat ?? p.y);
            const lng = parseFloat(p.lng ?? p.x);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
              lat,
              lng,
              name: p.name || p.title || "장소",
              url: p.url || p.place_url || "",
              address:
                p.address ||
                p.road_address_name ||
                p.address_name ||
                p.roadAddress ||
                p.addr ||
                "",
            };
          })
          .filter(Boolean);

        const center = pts[0]
          ? new kakao.maps.LatLng(pts[0].lat, pts[0].lng)
          : new kakao.maps.LatLng(37.5665, 126.978);

        const map = new kakao.maps.Map(containerRef.current, {
          center,
          level: 5,
        });
        mapRef.current = map;

        const bounds = new kakao.maps.LatLngBounds();

        pts.forEach((pt, idx) => {
          const pos = new kakao.maps.LatLng(pt.lat, pt.lng);
          bounds.extend(pos);

          const marker = new kakao.maps.Marker({
            map,
            position: pos,
            title: pt.name,
          });

          kakao.maps.event.addListener(marker, "click", () => {
            const rows = [
              { label: "주소", value: pt.address || "-" },
              pt.url
                ? {
                    label: "링크",
                    valueHtml: `<a href="${esc(
                      pt.url
                    )}" target="_blank" rel="noreferrer">바로가기</a>`,
                  }
                : null,
            ].filter(Boolean);

            const box = buildPopupBox(`${idx + 1}. ${pt.name}`, rows);
            openOverlay(map, overlayRef, pos, box);
          });

          markersRef.current.push(marker);
        });

        if (pts.length >= 2 && !bounds.isEmpty()) map.setBounds(bounds);

        cleanup = () => {
          markersRef.current.forEach((m) => m.setMap(null));
          markersRef.current = [];
          if (overlayRef.current) {
            overlayRef.current.setMap(null);
            overlayRef.current = null;
          }
          mapRef.current = null;
        };
      });
    })();

    return () => cleanup();
  }, [places, loadKakao]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #eee",
      }}
    />
  );
}
/* ========================================================== */

const ReviewLeftContent = ({
  review,
  canEdit = false,
  editHref,
  editState,
}) => {
  const navigate = useNavigate();

  /* ----- 이미지 처리 ----- */
  const images = useMemo(() => {
    const srcs = (Array.isArray(review?.images) ? review.images : [])
      .map((it) =>
        typeof it === "string" ? it : it?.imgUrl || it?.url || it?.src || null
      )
      .filter(Boolean);
    if (srcs.length) return srcs;
    return review?.image ? [review.image] : [];
  }, [review]);

  const [selectedImage, setSelectedImage] = useState(images[0] || null);
  useEffect(() => {
    setSelectedImage(images[0] || null);
  }, [images]);

  /* ----- 상단 타이틀 메타 ----- */
  const region = review?.region || "";
  const title = review?.title || "";
  const createdAtText = review?.createdAt
    ? `${fmtYmd(review.createdAt)} 작성`
    : "";

  /* ----- 태그/좋아요 ----- */
  const tagList = useMemo(() => normalizeReviewTags(review), [review]);
  const initialLikeCount = Number(review?.likeCount ?? review?.like ?? 0);
  const initialLiked = Boolean(
    review?.likedByMe ?? review?.liked ?? review?.userLiked ?? review?.isLiked
  );

  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [likeBusy, setLikeBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setLikeCount(initialLikeCount), [initialLikeCount]);
  useEffect(() => setLiked(initialLiked), [initialLiked]);

  /* ----- 방문일시/비용 ----- */
  const dateRaw = review?.date || review?.visitedDate || review?.datetime || "";
  const timeRaw = review?.time || review?.datetime || "";
  const visitedText = (() => {
    const d = fmtYmd(dateRaw);
    const t = fmtHm(timeRaw);
    return d ? (t ? `${d} ${t}` : d) : "";
  })();
  const costText = fmtCost(review?.cost);

  /* ----- 본문/팁 ----- */
  const description = review?.intro ?? review?.description ?? "";
  const tips = review?.detail ?? review?.tips ?? "";

  /* ----- 작성자 여부 ----- */
  const showEdit = useMemo(() => {
    if (canEdit) return true;
    const token = localStorage.getItem("accessToken");
    const payload = decodeJwtPayload(token);
    const currentUserId = payload?.sub ? String(payload.sub) : null;
    const authorId =
      review?.userProfile?.id != null
        ? String(review.userProfile.id)
        : review?.authorId != null
        ? String(review.authorId)
        : null;
    if (!currentUserId || !authorId) return false;
    return currentUserId === authorId;
  }, [canEdit, review?.userProfile?.id, review?.authorId]);

  const editTo = editHref ?? `/reviews/${review?.id}/edit`;
  const editStateObj = editState ?? { review, canEdit: true };

  /* ----- 좋아요 ----- */
  const onToggleLike = useCallback(async () => {
    if (!review?.id || likeBusy) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    setLikeBusy(true);
    try {
      const { data } = await api.post(`/reviews/${review.id}/likes`, {
        liked: !liked,
      });
      if (data && typeof data === "object") {
        if (typeof data.liked !== "undefined") setLiked(Boolean(data.liked));
        if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
      }
    } catch (e) {
      if (e?.response?.status === 401) alert("로그인이 필요합니다.");
      else alert("좋아요 처리에 실패했습니다.");
    } finally {
      setLikeBusy(false);
    }
  }, [review?.id, liked, likeBusy]);

  /* ----- 삭제 ----- */
  const onDelete = useCallback(async () => {
    if (!review?.id || deleting) return;
    if (!window.confirm("리뷰를 삭제할까요?")) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/reviews/${review.id}`);
      alert("리뷰가 삭제되었습니다.");
      navigate("/mypage", { replace: true });
    } catch (e) {
      if (e?.response?.status === 401) alert("로그인이 필요합니다.");
      else alert("리뷰 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }, [review?.id, deleting, navigate]);

  /* ----- 수정 이동 ----- */
  const onEdit = useCallback(() => {
    navigate(editTo, { state: editStateObj });
  }, [navigate, editTo, editStateObj]);

  /* ===== 점3개 메뉴 (백드롭 방식) ===== */
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const menuRef = useRef(null);

  const openMenu = () => {
    setMenuClosing(false);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    if (!menuOpen) return;
    setMenuOpen(false);
    setMenuClosing(true);
  };

  // ❌ 전역 document 리스너 없음 (백드롭이 대신 처리)

  return (
    <div className="review-left-content">
      <div className="title-meta-group">
        <div className="title-row with-action">
          {region && <span className="region-badge-title">{region}</span>}
          <h1 className="review-title">{title}</h1>

          {/* 점3개 메뉴 (백드롭으로 밖 클릭 처리) */}
          {showEdit && (
            <div className="action-menu" ref={menuRef}>
              <button
                type="button"
                className="icon-button"
                aria-haspopup="menu"
                aria-expanded={menuOpen ? "true" : "false"}
                aria-label="리뷰 메뉴 열기"
                onClick={() => (menuOpen ? closeMenu() : openMenu())}
              >
                <FiMoreVertical size={18} />
              </button>

              {(menuOpen || menuClosing) && (
                <>
                  {/* ✅ 밖 클릭 닫힘: 화면 전체 백드롭 */}
                  <button
                    type="button"
                    className={`action-backdrop ${
                      menuOpen ? "open" : "closing"
                    }`}
                    aria-label="메뉴 닫기"
                    onClick={closeMenu}
                  />
                  <div
                    className={`action-popover ${
                      menuOpen ? "open" : "closing"
                    }`}
                    role="menu"
                    onTransitionEnd={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (
                        e.propertyName !== "opacity" &&
                        e.propertyName !== "transform"
                      )
                        return;
                      if (!menuOpen) setMenuClosing(false);
                    }}
                  >
                    <button type="button" onClick={onEdit}>
                      <FiEdit2 /> 수정
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={deleting}
                      className="danger"
                    >
                      <FiTrash2 />
                      {deleting ? " 삭제 중…" : " 삭제"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {createdAtText && <p className="created-date">{createdAtText}</p>}
      </div>

      <div className="image-gallery-container">
        <div className="main-image-wrapper">
          {selectedImage ? (
            <img src={selectedImage} className="main-image" alt="대표 이미지" />
          ) : (
            <div className="main-image placeholder">이미지가 없습니다</div>
          )}
          {images.length > 4 && (
            <button
              type="button"
              className="overlay-show-all-button"
              onClick={() =>
                alert("전체 갤러리 보기 기능은 아직 준비 중이에요.")
              }
            >
              사진 모두 보기
            </button>
          )}
        </div>

        {images.length > 0 && (
          <div className="thumbnail-grid-wrapper">
            <div className="thumbnail-grid">
              {images.slice(0, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`thumb-${i}`}
                  className={`thumbnail ${
                    selectedImage === img ? "selected" : ""
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="review-header-row">
        {/* 태그 칩 */}
        {tagList.length > 0 && (
          <div className="tag-chips">
            {tagList.slice(0, 8).map((t) => (
              <span key={t} className="tag-chip">
                <span className="tag-icon">{TAG_ICON_MAP[t] || "🏷️"}</span>
                {t}
              </span>
            ))}
          </div>
        )}

        <span
          className="review-like"
          onClick={onToggleLike}
          role="button"
          title={likeBusy ? "처리 중..." : liked ? "좋아요 취소" : "좋아요"}
          style={{
            cursor: likeBusy ? "not-allowed" : "pointer",
            userSelect: "none",
          }}
        >
          <FontAwesomeIcon icon={faHeart} className="like-icon" /> {likeCount}
        </span>
      </div>

      <hr className="review-divider" />

      <div className="review-meta">
        {visitedText && (
          <div className="review-info">
            <FontAwesomeIcon icon={faClock} className="review-icon" />
            <span>{visitedText}</span>
          </div>
        )}
        {costText && (
          <div className="review-info">
            <FontAwesomeIcon icon={faCreditCard} className="review-icon" />
            <span>{costText}원</span>
          </div>
        )}
      </div>

      {description && (
        <div className="review-description">
          <h2>데이트 코스 소개</h2>
          <p>{description}</p>
        </div>
      )}

      {tips && (
        <div className="review-tip">
          <h2>상세 정보 및 팁</h2>
          <p>{tips}</p>
        </div>
      )}

      {Array.isArray(review?.places) && review.places.length > 0 && (
        <div className="review-map-section" style={{ marginBottom: 24 }}>
          <KakaoMiniMap places={review.places} height={300} />
        </div>
      )}
    </div>
  );
};

export default ReviewLeftContent;
