package com.knu.contentapi.domain.coursePlaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoursePlaceRepository extends JpaRepository<CoursePlace, Long> {
}
