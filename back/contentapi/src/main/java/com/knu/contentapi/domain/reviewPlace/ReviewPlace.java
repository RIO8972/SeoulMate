package com.knu.contentapi.domain.reviewPlace;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.knu.contentapi.domain.review.Review;
import jakarta.persistence.Entity;
import jakarta.persistence.*;
import lombok.*;

@Getter @ToString
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Builder
public class ReviewPlace {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "review_id")
    private Review review;

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
    @Column
    private String category;
}
