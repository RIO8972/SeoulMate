package com.knu.contentapi.dto.course;

import com.knu.contentapi.dto.places.PlaceRequestDto;
import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class CourseRequestDto {
    private Date datetime;
    private String title;
    private List<PlaceRequestDto> places;
}
