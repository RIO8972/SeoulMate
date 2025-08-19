package com.knu.contentapi.domain.ReviewLikes;

import com.knu.contentapi.domain.review.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    List<ReviewLike> findAllByUser_Id(Long userId);
    boolean existsByUser_IdAndReview_Id(Long userId, Long reviewId);
    void deleteByUser_IdAndReview_Id(Long userId, Long reviewId);
    long countByReview_Id(Long reviewId);
}

