package com.knu.contentapi.domain.reviewPlace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewPlaceRepository extends JpaRepository<ReviewPlace, Long> {
}
