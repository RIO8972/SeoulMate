package com.knu.contentapi.domain.ReviewLikes;

import com.knu.contentapi.domain.review.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    List<ReviewLike> findAllByUser_Id(Long userId);
    boolean existsByUser_IdAndReview_Id(Long userId, Long reviewId);
    void deleteByUser_IdAndReview_Id(Long userId, Long reviewId);
    long countByReview_Id(Long reviewId);

    //(review_id로 좋아요 전부 삭제)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ReviewLike rl where rl.review.id = :reviewId")
    int deleteByReviewId(@Param("reviewId") Long reviewId);
}

