import React from "react";
import "./style.css";
import Header from "../../components/Header";
import IntroSection from "../../components/IntroSection";
import SeoulMap from "../../components/Map/SeoulMap";
import ReviewPreview from "../../components/Review/ReviewPreview";

const Home = ({ reviews }) => {
  return (
    <>
      <Header />
      <main className="main-container">
        <IntroSection />
        <SeoulMap />
        <ReviewPreview reviews={reviews} />
      </main>
    </>
  );
};

export default Home;
