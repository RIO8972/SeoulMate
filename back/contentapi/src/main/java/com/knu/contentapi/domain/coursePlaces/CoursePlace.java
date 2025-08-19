package com.knu.contentapi.domain.coursePlaces;


import com.fasterxml.jackson.annotation.JsonBackReference;
import com.knu.contentapi.domain.course.Course;
import com.knu.contentapi.domain.review.Review;
import jakarta.persistence.*;
import lombok.*;

@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Builder
public class CoursePlace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @Column
    private String placeId;
    @Column
    private String name;
    @Column
    private String lat;
    @Column
    private String lng;
    @Column
    private String address;
    @Column
    private String url;
}
