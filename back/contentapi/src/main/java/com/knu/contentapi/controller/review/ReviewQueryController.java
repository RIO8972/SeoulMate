package com.knu.contentapi.controller.review;

import com.knu.contentapi.dto.review.ReviewResponseDto;
import com.knu.contentapi.service.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReviewQueryController { // <- 위에서 고른 이름으로 교체
    private final ReviewService reviewService;

    /** 최근 생성 리뷰 4개 */
    @GetMapping("/latest")
    public ResponseEntity<List<ReviewResponseDto>> latest4() {
        return ResponseEntity.ok(reviewService.getLatestReviews4());
    }
}