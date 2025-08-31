// src/components/Review/ReviewPreview.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleRight } from "@fortawesome/free-regular-svg-icons";
import ReviewCard from "../ReviewCard";
import axios from "axios";
import api from "../../../api/api";

/* YYYY.MM.DD */
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

/* API → ReviewCard prop 매핑 */
const toReviewCardData = (r) => ({
  id: r.id,
  title: r.title,
  region: r.region || "",
  image:
    r.image ||
    r.thumbnail ||
    (Array.isArray(r.images) ? r.images[0]?.imgUrl || r.images[0]?.url : undefined),
  visitedDate: fmtYmd(r.datetime || r.createdAt),
  cost: r.cost ?? 0,
  like: r.likeCount ?? r.like ?? 0,
  keyword: Array.isArray(r.categories) ? r.categories.join(" · ") : r.keyword || "",
});

const ReviewPreview = () => {
  const navigate = useNavigate();
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/latest")
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data.slice(0, 4) : [];
        setLatest(list);
      })
      .catch((e) => {
        console.error("[reviews/latest] error:", e);
        if (mounted) setLatest([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => latest.map(toReviewCardData), [latest]);

  return (
    <section className="review-preview-wrapper">
      <div className="preview-header">
        <button className="more-button" onClick={() => navigate("/reviews")}>
          리뷰 더보기
          <FontAwesomeIcon
            icon={faCircleRight}
            style={{ marginLeft: "6px", fontSize: "18px" }}
          />
        </button>
      </div>

      <div className="review-card-list">
        {loading
          ? null
          : cards.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                to={`/reviews/${review.id}`}
              />
            ))}
      </div>
    </section>
  );
};

export default ReviewPreview;
