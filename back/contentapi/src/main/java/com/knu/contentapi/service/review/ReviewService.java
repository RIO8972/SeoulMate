package com.knu.contentapi.service.review;


import com.knu.contentapi.domain.ReviewLikes.ReviewLike;
import com.knu.contentapi.domain.ReviewLikes.ReviewLikeRepository;
import com.knu.contentapi.domain.review.Review;
import com.knu.contentapi.domain.review.ReviewRepository;
import com.knu.contentapi.domain.reviewImg.ReviewImg;
import com.knu.contentapi.domain.reviewImg.ReviewImgRepository;
import com.knu.contentapi.domain.reviewPlace.ReviewPlace;
import com.knu.contentapi.domain.reviewPlace.ReviewPlaceRepository;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.course.CourseResponseDto;
import com.knu.contentapi.dto.places.PlaceRequestDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import com.knu.contentapi.dto.review.ReviewRequestDto;
import com.knu.contentapi.dto.review.ReviewResponseDto;
import com.knu.contentapi.dto.review.ReviewUpdateRequestDto;
import com.knu.contentapi.service.aws.AwsS3Service;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewService {

    private final AwsS3Service awsS3Service;
    private final ReviewRepository reviewRepository;
    private final ReviewPlaceRepository reviewPlaceRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final EntityManager em;
    private final ReviewImgRepository reviewImgRepository;


    public ReviewResponseDto getReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "review not found: " + id));
        return ReviewResponseDto.from(review); // 내부는 여전히 imgUrl 사용 가능
    }

    //추가: 로그인 사용자까지 받아 likedByMe 채워서 반환
    public ReviewResponseDto getReview(Long id, User user) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "review not found: " + id));

        boolean likedByMe = (user != null)
                && reviewLikeRepository.existsByUser_IdAndReview_Id(user.getId(), id);

        return ReviewResponseDto.from(review, likedByMe);
    }

    public List<ReviewResponseDto> getUserReviews(User user) { //본인이 작성한 리뷰글 조회
        List<Review> reviews = reviewRepository.findAllByUser_Id(user.getId());
        return reviews.stream().map(r -> ReviewResponseDto.builder()
                        .id(r.getId())
                        .categories(r.getCategories())
                        .cost(r.getCost())
                        .datetime(r.getDatetime())
                        .detail(r.getDetail())
                        .intro(r.getIntro())
                        .region(r.getRegion())
                        .title(r.getTitle())
                        .places(r.getPlacesDto())
                        .images(r.getReviewImgDto())
                        .createdAt(r.getCreatedAt())
                        .likeCount(r.getLikeCount())
                        .build())
                .toList();
    }
    public List<ReviewResponseDto> getLikesReviews(User user) { //본인이 "좋아요"누른 리뷰글 조회
        List<ReviewLike> likes  = reviewLikeRepository.findAllByUser_Id(user.getId());
        return likes.stream()
                .map(like -> ReviewResponseDto.from(like.getReview()))
                .toList();
    }
    public List<PlaceResponseDto> getReviewPlaces(Long id) { //리뷰에서 장소만 뜯어내기
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "review not found: " + id));
        return review.getPlacesDto();
    }

    @Transactional
    public Long createReview(ReviewRequestDto requestDto,
                             List<MultipartFile> images,
                             User user) {

        Review review = Review.builder()
                .title(requestDto.getTitle())
                .detail(requestDto.getDetail())
                .intro(requestDto.getIntro())
                .cost(requestDto.getCost())
                .datetime(requestDto.getDatetime())
                .region(requestDto.getRegion())
                .user(user)
                .build();

        if (requestDto.getCategories() != null) {
            var cats = requestDto.getCategories().stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(String::trim).distinct().toList();
            review.replaceCategories(cats);
        }
        if (requestDto.getPlaces() != null) {
            requestDto.getPlaces().forEach(review::addPlace);
        }

        // 이미지 업로드 (Key + URL)
        var safeImages = (images == null) ? List.<MultipartFile>of()
                : images.stream().filter(f -> f != null && !f.isEmpty()).toList();

        var uploadedKeys = new java.util.ArrayList<String>();
        if (!safeImages.isEmpty()) {
            try {
                for (MultipartFile file : safeImages) {
                    AwsS3Service.S3PutResult put = awsS3Service.uploadFileReturnKeyAndUrl(file);
                    uploadedKeys.add(put.getKey());
                    review.addImg(put.getUrl(), put.getKey()); // URL + KEY 함께 저장
                }
            } catch (RuntimeException e) {
                uploadedKeys.forEach(awsS3Service::deleteByKey);
                throw e;
            }
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) uploadedKeys.forEach(awsS3Service::deleteByKey);
                }
            });
        }

        reviewRepository.save(review);
        return review.getId();
    }
    public void deleteReview(Long id) {
        Review review = reviewRepository.findWithImgsById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "review not found: " + id));

        // 1) 리뷰 좋아요 선삭제 (FK 끊기)
        reviewLikeRepository.deleteByReviewId(id);

        // 2) S3 키 모으기 (지금 있는 코드 그대로)
        var keys = review.getReviewImgs().stream()
                .map(ReviewImg::getS3Key)
                .filter(k -> k != null && !k.isBlank())
                .toList();

        // 3) 리뷰 삭제 (이미지/장소는 orphanRemoval + cascade로 함께 정리)
        reviewRepository.delete(review);

        // 4) 커밋 이후 S3에서 실제 파일 삭제
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { keys.forEach(awsS3Service::deleteByKey); }
        });
    }

    public void deleteReviewPlace(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "review not found: " + id));

        ReviewPlace reviewPlace = review.getReviewPlaces().get(0); // 테스트용
        review.getReviewPlaces().remove(0);
        reviewPlaceRepository.deleteById(reviewPlace.getId());
    }

    public void updateReview(Long id, ReviewUpdateRequestDto dto, List<MultipartFile> images) {
        Review review = reviewRepository.findWithImgsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "review not found: " + id));

        // 새 이미지 업로드 → URL+KEY 함께 저장
        List<MultipartFile> safeImages = (images == null) ? List.of()
                : images.stream().filter(f -> f != null && !f.isEmpty()).toList();

        if (!safeImages.isEmpty()) {
            List<String> newKeys = new java.util.ArrayList<>();
            try {
                for (MultipartFile f : safeImages) {
                    AwsS3Service.S3PutResult put = awsS3Service.uploadFileReturnKeyAndUrl(f);
                    newKeys.add(put.getKey());
                    review.addImg(put.getUrl(), put.getKey());
                }
            } catch (RuntimeException e) {
                newKeys.forEach(awsS3Service::deleteByKey);
                throw e;
            }
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) newKeys.forEach(awsS3Service::deleteByKey);
                }
            });
        }

        // 기존 이미지 삭제 (dto.deleteImgs 는 ReviewImg.id 리스트)
        if (dto.getDeleteImgs() != null && !dto.getDeleteImgs().isEmpty()) {
            var toDelete = review.getReviewImgs().stream()
                    .filter(img -> dto.getDeleteImgs().contains(img.getId()))
                    .toList();

            var keys = toDelete.stream()
                    .map(ReviewImg::getS3Key)
                    .filter(k -> k != null && !k.isBlank())
                    .toList();

            toDelete.forEach(review::removeImg); // orphanRemoval

            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { keys.forEach(awsS3Service::deleteByKey); }
            });
        }
        review.updateFrom(dto);
    }

    /** 좋아요 토글: true=좋아요됨, false=좋아요 취소됨 */
    public boolean toggleLike(Long userId, Long reviewId) {
        // 존재 검증(선택): 없는 리뷰면 404
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResponseStatusException(NOT_FOUND, "review not found: " + reviewId);
        }

        boolean already = reviewLikeRepository.existsByUser_IdAndReview_Id(userId, reviewId);
        if (already) {
            // 좋아요 취소
            reviewLikeRepository.deleteByUser_IdAndReview_Id(userId, reviewId);
            reviewRepository.decrementLike(reviewId);   // like_count - 1 (0 미만 방지 쿼리)
            return false;
        } else {
            // 좋아요 추가 (엔티티 조회 대신 getReference로 프록시 참조)
            ReviewLike like = ReviewLike.builder()
                    .user(em.getReference(User.class, userId))
                    .review(em.getReference(Review.class, reviewId))
                    .build();
            reviewLikeRepository.save(like);
            reviewRepository.incrementLike(reviewId);   // like_count + 1
            return true;
        }
    }
    // ★ 추가: 현재 likeCount 조회용
    @Transactional
    public long getLikeCount(Long reviewId) {
        return reviewRepository.findLikeCountById(reviewId);
    }

    public List<ReviewResponseDto> getLatestReviews4() {
        return reviewRepository.findTop4ByOrderByCreatedAtDesc()
                .stream()
                .map(ReviewResponseDto::from)   // 이미 구현되어 있음
                .toList();
    }
}
