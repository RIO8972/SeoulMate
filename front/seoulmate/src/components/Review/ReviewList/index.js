import React from "react";
import "./style.css";
import ReviewCard from "../ReviewCard";

const ReviewList = ({ review }) => {
  return <ReviewCard review={review} />;
};

export default ReviewList;
