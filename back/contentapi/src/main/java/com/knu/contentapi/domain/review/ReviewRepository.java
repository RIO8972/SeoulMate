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
    @Query("select r from Review r left join fetch r.reviewImgs where r.id = :id")
    Optional<Review> findWithImgsById(@Param("id") Long id);


    // ... 기존 메서드들 (예: findWithImgsById, findAllByUser_Id 등)

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
}
