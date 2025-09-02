package com.knu.contentapi.domain.reviewImg;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewImgRepository extends JpaRepository<ReviewImg, Long> {
    // 유저가 소유한 모든 리뷰 이미지의 s3Key 수집 (키가 있는 경우만)
    @Query("""
        select ri.s3Key
        from ReviewImg ri
        where ri.review.user.id = :userId
          and ri.s3Key is not null
          and ri.s3Key <> ''
    """)
    List<String> findAllS3KeysByUserId(@Param("userId") Long userId);

    // (옵션) 과거 데이터 중 s3Key 없는 이미지 URL 수집 (있다면 URL 기반 삭제용)
    @Query("""
        select ri.imgUrl
        from ReviewImg ri
        where ri.review.user.id = :userId
          and (ri.s3Key is null or ri.s3Key = '')
          and ri.imgUrl is not null and ri.imgUrl <> ''
    """)
    List<String> findAllImgUrlsWithoutKeyByUserId(@Param("userId") Long userId);

    // 유저의 모든 리뷰에 속한 이미지 벌크 삭제
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from ReviewImg ri
        where ri.review.id in (
            select r.id from Review r where r.user.id = :userId
        )
    """)
    int deleteByReviewUserId(@Param("userId") Long userId);
}
