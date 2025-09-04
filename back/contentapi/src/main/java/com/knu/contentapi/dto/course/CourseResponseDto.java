package com.knu.contentapi.dto.course;


import com.knu.contentapi.domain.course.Course;
import com.knu.contentapi.dto.places.PlaceRequestDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class CourseResponseDto {
    private Long id;
    private List<String> categories;
    private Date datetime;
    private String title;
    private List<PlaceResponseDto> places;

    public static CourseResponseDto from(Course course) {
        return CourseResponseDto.builder()
                .id(course.getId())
                .datetime(course.getDatetime())
                .title(course.getTitle())
                .categories(course.getCategories())
                .places(course.getPlacesDto())
                .build();
    }
}
