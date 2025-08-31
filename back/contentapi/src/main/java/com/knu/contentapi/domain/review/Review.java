package com.knu.contentapi.domain.review;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.knu.contentapi.domain.reviewImg.ReviewImg;
import com.knu.contentapi.domain.reviewPlace.ReviewPlace;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.places.PlaceRequestDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import com.knu.contentapi.dto.review.ReviewUpdateRequestDto;
import com.knu.contentapi.dto.reviewImg.ReviewImgDto;
import jakarta.persistence.*;
import lombok.*;
import jakarta.persistence.Entity;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.CreationTimestamp;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Slf4j
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String intro;
    @Column
    private String title;
    @Column
    private String detail;
    @Column
    private int cost;
    @Column
    private Date datetime;
    @Column
    private String region;

    @Builder.Default
    @Column(nullable = false)
    private long likeCount = 0L;
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "review_categories",
            joinColumns = @JoinColumn(name = "review_id")
    )
    @Column(name = "category", length = 50)   // 개별 값: "카페", "야외" ...
    @OrderColumn(name = "category_idx")       // (선택) 입력 순서 유지
    @Builder.Default
    private List<String> categories = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    @JsonManagedReference
    @OneToMany(
            mappedBy="review",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    @OrderColumn(name = "image_idx")    // 이 컬럼에 List 인덱스가 저장
    private List<ReviewImg> reviewImgs = new ArrayList<>();

    @JsonManagedReference
    @OneToMany(
            mappedBy="review",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    @OrderColumn(name = "place_idx")    // 이 컬럼에 List 인덱스가 저장
    private List<ReviewPlace> reviewPlaces = new ArrayList<>();

    public void incLikeCount() { this.likeCount++; } //?
    public void decLikeCount() { if (this.likeCount > 0) this.likeCount--; } //?

    public void addImg(String imgUrl) {
        log.info("addImg>>");
        ReviewImg reviewImg = ReviewImg.builder()
                .imgUrl(imgUrl)
                .review(this)
                .build();
        reviewImgs.add(reviewImg);
    }
    /** 신규: URL + s3Key 함께 저장 (권장) */
    public void addImg(String imgUrl, String s3Key) {
        log.info("addImg(url,key) >> {}, {}", imgUrl, s3Key);
        ReviewImg reviewImg = ReviewImg.builder()
                .imgUrl(imgUrl)
                .s3Key(s3Key)
                .review(this)
                .build();
        reviewImgs.add(reviewImg);
    }

    public void addPlace(PlaceRequestDto dto) {
        log.info("add_ReviewPlace>>");
        ReviewPlace reviewPlace = ReviewPlace.builder()
                .placeId(dto.getPlaceId())
                .name(dto.getName())
                .lat(dto.getLat())
                .lng(dto.getLng())
                .address(dto.getAddress())
                .url(dto.getUrl())
                .category(dto.getCategory())
                .review(this)
                .build();
        reviewPlaces.add(reviewPlace);
    }

    public void removeImg(ReviewImg img) {
        if (img == null) return;
        reviewImgs.remove(img);     // orphanRemoval로 DB에서 삭제
        img.unlinkReview();         // 메모리 일관성 유지 (아래 ReviewImg 참조)
    }

    public void replaceCategories(List<String> cats) {
        this.categories.clear();
        if (cats != null) this.categories.addAll(cats);
    }
    /** 메타 필드 일괄 변경 */
    public void changeMeta(String title, String intro, String detail, int cost, Date datetime, String region) {
        this.title = title;
        this.intro = intro;
        this.detail = detail;
        this.cost = cost;
        this.datetime = datetime;
        this.region = region;
    }
    /** 리뷰 전체 갱신(메타 + 카테고리 + 장소 전량교체) */
    public Review updateFrom(ReviewUpdateRequestDto dto) {
        // 1) 메타
        changeMeta(
                dto.getTitle(),
                dto.getIntro(),
                dto.getDetail(),
                dto.getCost(),
                dto.getDatetime(),
                dto.getRegion()
        );
        // 2) 카테고리
        replaceCategories(dto.getCategories());
        // 3) 장소 전량 교체 (orphanRemoval)
        this.reviewPlaces.clear();
        if (dto.getPlaces() != null) {
            for (PlaceRequestDto p : dto.getPlaces()) {
                this.addPlace(p);
            }
        }
        return this;
    }

    public List<PlaceResponseDto> getPlacesDto() {
        List<PlaceResponseDto> _places = new ArrayList<>();
        for(ReviewPlace place : this.reviewPlaces) {
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
    public List<ReviewImgDto> getReviewImgDto() {
        List<ReviewImgDto> _images = new ArrayList<>();
        for(ReviewImg image : this.reviewImgs) {
            ReviewImgDto dto = ReviewImgDto.builder()
                    .id(image.getId())
                    .imgUrl(image.getImgUrl())
                    .build();
            _images.add(dto);
        }
        return _images;
    }

}