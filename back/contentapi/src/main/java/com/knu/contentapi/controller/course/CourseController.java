package com.knu.contentapi.controller.course;

import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.course.CourseRequestDto;
import com.knu.contentapi.service.course.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


//@CrossOrigin(origins = "http://localhost:3000") //나중에 배포시 삭제
@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/courses")
public class CourseController {

    final private CourseService courseService;

    /** 단일 코스 조회 */
    @GetMapping( value = "/{id}")
    public ResponseEntity<?> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourse(id));
    }

    /** 내 코스들 조회 */
    @GetMapping("/mine")
    public ResponseEntity<?> getCourse(@AuthenticationPrincipal User user) { //안되면 securityconfig에 주소 추가
        return ResponseEntity.ok(courseService.getUserCourses(user));
    }

    /** 코스 생성 */
    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,      // 명시 이거 왜했지??확인하기
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> createCourse(
            @AuthenticationPrincipal User user,
            @RequestBody CourseRequestDto dto
    ) {
        log.info(dto.toString());
        courseService.saveCourseTest(dto, user);
        return ResponseEntity.ok(dto);
    }

    /** 코스 수정 */
    @PutMapping(
            value = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE,      // 명시 이거 왜했지??
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> updateCourse(
            @RequestBody CourseRequestDto dto,
            @PathVariable Long id
    ) {
        log.info(dto.toString());
        courseService.updateCourse(id,dto);
        return ResponseEntity.noContent().build();
    }

    /** 코스 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(id);
    }
}
