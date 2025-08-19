package com.knu.contentapi.domain.course;

import com.knu.contentapi.domain.carts.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findAllByUser_Id(Long userId);
}
