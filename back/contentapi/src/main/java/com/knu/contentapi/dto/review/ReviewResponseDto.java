package com.knu.contentapi.dto.review;


import com.knu.contentapi.domain.course.Course;
import com.knu.contentapi.domain.review.Review;
import com.knu.contentapi.dto.course.CourseResponseDto;
import com.knu.contentapi.dto.places.PlaceRequestDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import com.knu.contentapi.dto.reviewImg.ReviewImgDto;
import com.knu.contentapi.dto.users.UserProfileDto;
import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ReviewResponseDto {
    private long id;//추가 부분
    private List<String> categories;
    private int cost;
    private String date;
    private Date datetime;       // yyyy-MM-dd 형식으로 바인딩
    private String detail;
    private String intro;
    private String region;
    private String time;
    private String title;
    private long likeCount;
    private java.time.LocalDateTime createdAt;
    private List<PlaceResponseDto> places;   // 추가
    private List<ReviewImgDto> images;   // 추가
    private UserProfileDto userProfile; //추가
    private boolean likedByMe; // 추가: 현재 로그인 사용자가 좋아요했는지

    public static ReviewResponseDto from(Review review) {
        return
                ReviewResponseDto.builder()
                        .id(review.getId())
                        .categories(review.getCategories())
                        .cost(review.getCost())
                        .datetime(review.getDatetime())
                        .detail(review.getDetail())
                        .intro(review.getIntro())
                        .region(review.getRegion())
                        .title(review.getTitle())
                        .places(review.getPlacesDto())
                        .images(review.getReviewImgDto())
                        .createdAt(review.getCreatedAt())
                        .likeCount(review.getLikeCount())
                        .userProfile(UserProfileDto.from(review.getUser()))
                        .likedByMe(false) // 기본값
                        .build();
    }

    //추가: likedByMe까지 채우는 팩토리
    public static ReviewResponseDto from(Review review, boolean likedByMe) {
        ReviewResponseDto dto = from(review);
        dto.setLikedByMe(likedByMe);
        return dto;
    }
}