package com.knu.contentapi.domain.course;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.knu.contentapi.domain.coursePlaces.CoursePlace;
import com.knu.contentapi.domain.reviewPlace.ReviewPlace;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.course.CourseRequestDto;
import com.knu.contentapi.dto.places.PlaceRequestDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Slf4j
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column
    private Date datetime;
    @Column
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @JsonManagedReference
    @OneToMany(
            mappedBy="course",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    @OrderColumn(name = "place_idx")    // 이 컬럼에 List 인덱스가 저장
    private List<CoursePlace> coursePlaces = new ArrayList<>();

    public void addPlace(PlaceRequestDto dto) {
        log.info("add_CoursePlace>>");

        CoursePlace coursePlace = CoursePlace.builder()
                .placeId(dto.getPlaceId())
                .name(dto.getName())
                .lat(dto.getLat())
                .lng(dto.getLng())
                .address(dto.getAddress())
                .url(dto.getUrl())
                .category(dto.getCategory())
                .course(this)
                .build();
        coursePlaces.add(coursePlace);
    }

    public Course updateCourse(CourseRequestDto dto) {
        this.title = dto.getTitle();
        this.datetime = dto.getDatetime();
        this.coursePlaces.clear();

        // 2) DTO 순서대로 다시 추가 (연관관계 주인 세팅 포함)
        for (PlaceRequestDto p : dto.getPlaces()) {
            this.addPlace(p); // addPlace 내부에서 course=this 세팅
        }
        return this;
    }

    public List<PlaceResponseDto> getPlacesDto() {
        List<PlaceResponseDto> _places = new ArrayList<>();
        for(CoursePlace place : this.coursePlaces) {
            PlaceResponseDto dto = PlaceResponseDto.builder()
                    .placeId(place.getPlaceId())
                    .name(place.getName())
                    .lat(place.getLat())
                    .lng(place.getLng())
                    .address(place.getAddress())
                    .url(place.getUrl())
                    .category(place.getCategory())
                    .build();
            _places.add(dto);
        }
        return _places;
    }
}
