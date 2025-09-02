package com.knu.contentapi.domain.coursePlaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CoursePlaceRepository extends JpaRepository<CoursePlace, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from CoursePlace cp
        where cp.course.id in (
            select c.id from Course c where c.user.id = :userId
        )
    """)
    int deleteByCourseUserId(@Param("userId") Long userId);
}
