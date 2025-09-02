package com.knu.contentapi.domain.ReviewLikes;

import com.knu.contentapi.domain.review.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {
    public static interface ReviewLikeAgg {
        Long getReviewId();
        long getCnt();
    }
    List<ReviewLike> findAllByUser_Id(Long userId);
    boolean existsByUser_IdAndReview_Id(Long userId, Long reviewId);
    void deleteByUser_IdAndReview_Id(Long userId, Long reviewId);
    long countByReview_Id(Long reviewId);

    //(review_id로 좋아요 전부 삭제)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ReviewLike rl where rl.review.id = :reviewId")
    int deleteByReviewId(@Param("reviewId") Long reviewId);

    // 내가 누른 좋아요 전부 삭제
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ReviewLike rl where rl.user.id = :userId")
    int deleteByUserId(@Param("userId") Long userId);

    // 내 리뷰에 달린 좋아요 전부 삭제
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from ReviewLike rl
        where rl.review.id in (
            select r.id from Review r where r.user.id = :userId
        )
    """)
    int deleteByReviewOwnerId(@Param("userId") Long userId);


    @Query("""
           select rl.review.id as reviewId, count(rl) as cnt
             from ReviewLike rl
            where rl.user.id = :uid
            group by rl.review.id
           """)
    List<ReviewLikeAgg> countByUserGrouped(@Param("uid") Long uid);

    // 내가 남에게 누른 좋아요를 리뷰별 집계 (자기 글 제외)
    @Query("""
           select rl.review.id as reviewId, count(rl) as cnt
             from ReviewLike rl
            where rl.user.id = :uid
              and rl.review.user.id <> :uid
            group by rl.review.id
           """)
    List<ReviewLikeAgg> countByUserGroupedExcludingOwn(@Param("uid") Long uid);
}


