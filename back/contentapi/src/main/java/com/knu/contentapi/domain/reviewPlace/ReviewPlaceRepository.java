package com.knu.contentapi.domain.reviewPlace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewPlaceRepository extends JpaRepository<ReviewPlace, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from ReviewPlace rp
        where rp.review.id in (
            select r.id from Review r where r.user.id = :userId
        )
    """)
    int deleteByReviewUserId(@Param("userId") Long userId);
}
