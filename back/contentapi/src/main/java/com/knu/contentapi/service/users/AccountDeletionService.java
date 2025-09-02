package com.knu.contentapi.service.users;

import com.knu.contentapi.domain.ReviewLikes.ReviewLikeRepository;
import com.knu.contentapi.domain.carts.CartRepository;
import com.knu.contentapi.domain.course.CourseRepository;
import com.knu.contentapi.domain.coursePlaces.CoursePlaceRepository;
import com.knu.contentapi.domain.review.ReviewRepository;
import com.knu.contentapi.domain.reviewImg.ReviewImgRepository;
import com.knu.contentapi.domain.reviewPlace.ReviewPlaceRepository;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.domain.users.UserRepository;
import com.knu.contentapi.service.aws.AwsS3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountDeletionService {

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewImgRepository reviewImgRepository;
    private final ReviewPlaceRepository reviewPlaceRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final CoursePlaceRepository coursePlaceRepository;
    private final CourseRepository courseRepository;
    private final CartRepository cartRepository;
    private final AwsS3Service awsS3Service;

    @Transactional
    public void deleteAccount(User principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("user not found"));
        Long uid = user.getId();

        // 0) S3 삭제 대상 미리 수집 (커밋 후 지울 것들)
        List<String> s3Keys = new ArrayList<>(reviewImgRepository.findAllS3KeysByUserId(uid));
        List<String> urlOnly = reviewImgRepository.findAllImgUrlsWithoutKeyByUserId(uid); // (옵션)
        String profileUrl = user.getImgUrl();

        // 1) 내가 남에게 누른 좋아요 집계 → likeCount 보정
        var aggs = reviewLikeRepository.countByUserGroupedExcludingOwn(uid); // rl.review.user.id <> :uid
        for (var a : aggs) {
            reviewRepository.decrementBy(a.getReviewId(), a.getCnt());
        }

        // 2) 좋아요 일괄 삭제
        reviewLikeRepository.deleteByUserId(uid);          // 내가 누른 좋아요
        reviewLikeRepository.deleteByReviewOwnerId(uid);   // 내 리뷰에 달린 좋아요

        // 3) 자식(이미지·장소)
        reviewImgRepository.deleteByReviewUserId(uid);
        reviewPlaceRepository.deleteByReviewUserId(uid);

        // 4) 부모(리뷰/코스)
        reviewRepository.deleteByUserId(uid);
        coursePlaceRepository.deleteByCourseUserId(uid);
        courseRepository.deleteByUserId(uid);

        // 5) 그 외(장바구니 등)
        cartRepository.deleteByUserId(uid);

        // 6) 유저 삭제
        userRepository.delete(user);

        // 7) 커밋 후 S3 정리
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                for (String key : s3Keys) {
                    try { awsS3Service.deleteByKey(key); }
                    catch (Exception e) { log.warn("S3 key delete failed: {}", key, e); }
                }
                for (String url : urlOnly) { // 키 없는 레거시
                    try { awsS3Service.deleteFile(url); }
                    catch (Exception e) { log.warn("S3 url delete failed: {}", url, e); }
                }
                if (profileUrl != null && !profileUrl.isBlank()) {
                    try { awsS3Service.deleteFile(profileUrl); }
                    catch (Exception e) { log.warn("S3 profile delete failed: {}", profileUrl, e); }
                }
            }
        });
    }
}
