package com.knu.contentapi.controller.review;

import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.review.ReviewResponseDto;
import com.knu.contentapi.dto.review.SliceResponse;
import com.knu.contentapi.service.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReviewQueryController { // <- 위에서 고른 이름으로 교체
    private final ReviewService reviewService;

    /** 무한 스크롤: 최신순 */
    @GetMapping("reviews-list")
    public ResponseEntity<SliceResponse<ReviewResponseDto>> list(
            @RequestParam(defaultValue = "12") Integer size,
            @RequestParam(required = false) String cursor
    ) {
        return ResponseEntity.ok(reviewService.listReviewsLatest(size, cursor));
    }

    /** 좋아요 토글 → 최신 카운트 같이 반환 */
    @PostMapping("/{id}/like")
    public Map<String, Object> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        boolean liked = reviewService.toggleLike(user.getId(), id);
        long count = reviewService.getLikeCount(id);
        return Map.of("liked", liked, "likeCount", count);
    }

    /** 최근 생성 리뷰 4개 */
    @GetMapping("/latest")
    public ResponseEntity<List<ReviewResponseDto>> latest4() {
        return ResponseEntity.ok(reviewService.getLatestReviews4());
    }
}