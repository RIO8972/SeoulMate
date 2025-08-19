package com.knu.contentapi.domain.reviewImg;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.knu.contentapi.domain.review.Review;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ReviewImg {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "review_id")
    private Review review;
    @Column(name = "img_url")
    private String imgUrl;

    @Column(name = "s3_key", length = 1024)    // 운영용 Key (신규)
    private String s3Key;


    public void unlinkReview() { this.review = null; }
}
