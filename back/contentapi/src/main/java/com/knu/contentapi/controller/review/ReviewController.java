package com.knu.contentapi.controller.review;

import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import com.knu.contentapi.dto.review.ReviewRequestDto;
import com.knu.contentapi.dto.review.ReviewResponseDto;
import com.knu.contentapi.dto.review.ReviewUpdateRequestDto;
import com.knu.contentapi.service.review.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000") //나중에 배포시 삭제
@RestController
@RequiredArgsConstructor
@RequestMapping("/reviews")
@Slf4j
public class ReviewController {
    private final ReviewService reviewService;

    /** 단일 리뷰 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<?> getReview(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(reviewService.getReview(id));
    }

    /** 내가 쓴 리뷰 목록 */
    @GetMapping("/mine")
    public ResponseEntity<?> getReview(@AuthenticationPrincipal User user) { //자기가쓴 리뷰글 조회
        return ResponseEntity.ok(reviewService.getUserReviews(user));
    }

    /** 내가 좋아요한 리뷰 목록 */
    @GetMapping("mine/likes")
    public ResponseEntity<List<ReviewResponseDto>> getLikeReviews(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(reviewService.getLikesReviews(user));
    }


    /** 리뷰의 장소들 조회(리뷰에서 장소 그대로 가져올 때) */
    @GetMapping("/{id}/places")
    public ResponseEntity<List<PlaceResponseDto>> getReviewPlaces(@PathVariable Long id) { //리뷰에서 장소만 꺼내기
        return ResponseEntity.ok(reviewService.getReviewPlaces(id));
    }

    /** 리뷰 생성 (이미지+JSON 함께 전송) */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createTestReview(  //로그인 유무판별 후 저장할 때
            @AuthenticationPrincipal User user,
            @RequestPart("dto")    ReviewRequestDto        dto,     // JSON 전체를 이 DTO 로 바인딩
            @RequestPart("images") List<MultipartFile>     images   // 파일 리스트
    ) {
        log.info("usr    = {}", user.toString());
        log.info("dto    = {}", dto);
        log.info("places = {}", dto.getPlaces());
        log.info("images = {}", images.size());
        reviewService.createReview(dto, images, user);
        return ResponseEntity.ok("리뷰저장성공");
    }

    /** 리뷰 전체 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) { //리뷰전체 삭제
        reviewService.deleteReview(id);
        return ResponseEntity.ok("삭제성공");
    }
    @DeleteMapping("/place/{id}")
    public ResponseEntity<?> deleteReviewPlace(@PathVariable Long id) {//장소 단일 삭제(안쓰면 나중에 삭제)
        reviewService.deleteReviewPlace(id);
        return ResponseEntity.ok("장소_삭제성공");
    }

    /** 리뷰 수정 */
    @PutMapping(
            value = "/{id}", //나중에 url 수정
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> updateReview(
            @PathVariable Long id,
            @RequestPart("dto") ReviewUpdateRequestDto     dto,     // JSON 전체를 이 DTO 로 바인딩
            @RequestPart(value = "images", required = false) List<MultipartFile>     images   // 파일 리스트
    ) {
        log.info(dto.toString());
        log.info("images count={}", images == null ? 0 : images.size()); // <-- NPE 방지
        reviewService.updateReview(id, dto, images);
        return ResponseEntity.ok("수정성공");
    }

    /** 좋아요 토글*/
    @PostMapping("/{id}/likes")
    public ResponseEntity<?> toggleLike(@AuthenticationPrincipal User user,
                                        @PathVariable Long id) {
        if (user == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }
        boolean liked = reviewService.toggleLike(user.getId(), id);

        return ResponseEntity.ok(Map.of(
                "liked", liked
                // , "likeCount", likeCount   // 필요하면 주석 해제
        ));
    }
}
