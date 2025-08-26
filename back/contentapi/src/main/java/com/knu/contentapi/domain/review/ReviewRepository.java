package com.knu.contentapi.domain.review;

import com.knu.contentapi.domain.carts.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findAllByUser_Id(Long userId);

    Optional<Review> findWithImgsAndPlacesById(@Param("id") Long id);
    @Query("select r.likeCount from Review r where r.id = :id")
    long findLikeCountById(@Param("id") Long id);

    @Query("select r from Review r left join fetch r.reviewImgs where r.id = :id")
    Optional<Review> findWithImgsById(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Review r set r.likeCount = r.likeCount + 1 where r.id = :id")
    int incrementLike(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
           update Review r
              set r.likeCount = case when r.likeCount > 0 then r.likeCount - 1 else 0 end
            where r.id = :id
           """)
    int decrementLike(@Param("id") Long id);

    // 최신 4건
    List<Review> findTop4ByOrderByCreatedAtDesc();
}
