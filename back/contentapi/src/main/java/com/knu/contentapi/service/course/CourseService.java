package com.knu.contentapi.service.course;

import com.knu.contentapi.domain.carts.Cart;
import com.knu.contentapi.domain.course.Course;
import com.knu.contentapi.domain.course.CourseRepository;
import com.knu.contentapi.domain.coursePlaces.CoursePlace;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.course.CourseRequestDto;
import com.knu.contentapi.dto.course.CourseResponseDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {
    private final CourseRepository courseRepository;


    @Transactional(readOnly = true)
    public CourseResponseDto getCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "course not found: " + id));
        return CourseResponseDto.from(course);  // 엔티티 → 응답 DTO 변환
    }

    @Transactional(readOnly = true)
    public List<CourseResponseDto> getUserCourses(User user) {
        List<Course> carts = courseRepository.findAllByUser_Id(user.getId());
        return carts.stream()
                .map(c -> CourseResponseDto.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .datetime(c.getDatetime())
                        .places(c.getPlacesDto())
                        .build())
                .toList();
    }

    public Long saveCourseTest(CourseRequestDto dto, User user) {
        Course course = Course.builder()
                .user(user)
                .title(dto.getTitle())
                .datetime(dto.getDatetime())
                .build();
        dto.getPlaces().forEach(course::addPlace); // addPlace가 양방향/연관 설정 수행
        return courseRepository.save(course).getId();
    }

    public void updateCourse(Long id, CourseRequestDto dto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "course not found: " + id));
        course.updateCourse(dto);  // 내부에서 필드/컬렉션 변경 (orphanRemoval 패턴)
    }

    public void deleteCourse(Long id) {
        // 연관 매핑에 cascade+orphanRemoval 있으면 이 방식이 가장 안전
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "course not found: " + id));
        courseRepository.delete(course);
    }
}