package com.knu.contentapi.domain.reviewImg;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewImgRepository extends JpaRepository<ReviewImg, Long> {
}
