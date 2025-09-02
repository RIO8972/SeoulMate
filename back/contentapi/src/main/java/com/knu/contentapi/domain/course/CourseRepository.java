package com.knu.contentapi.domain.course;

import com.knu.contentapi.domain.carts.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findAllByUser_Id(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Course c where c.user.id = :userId")
    int deleteByUserId(@Param("userId") Long userId);
}
