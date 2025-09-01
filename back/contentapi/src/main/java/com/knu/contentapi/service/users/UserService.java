package com.knu.contentapi.service.users;

import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.domain.users.UserRepository;
import com.knu.contentapi.dto.users.UserUpdateRequestDto;
import com.knu.contentapi.service.aws.AwsS3Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {
    final private UserRepository userRepository;
    final private AwsS3Service awsS3Service;

    public void updateUserImage(User principal, MultipartFile image) {
        // principal은 보통 Detach이므로, 반드시 Managed 엔티티로 다시 조회
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("user not found"));

        if (image != null && !image.isEmpty()) {
            AwsS3Service.S3PutResult put;
            try {
                put = awsS3Service.uploadFileReturnKeyAndUrl(image); // S3 업로드
                //review.addImg(put.getUrl(), put.getKey());           // URL+KEY 함께 저장(엔티티 메서드)
                user.updateImg(put.getUrl());
            } catch (RuntimeException e) {
                // 업로드 자체가 실패했다면 key가 없을 수도 있음
                throw e;
            }

            // 트랜잭션 롤백 시 S3 정리
            final String uploadedKey = put.getKey();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        awsS3Service.deleteByKey(uploadedKey);
                    }
                }
            });
        }
    }

    public void updateUserName(User principal,String username) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("user not found"));

        if (org.springframework.util.StringUtils.hasText(username)) {
            user.updateUserName(username.trim()); // 변경감지 대상
        }
    }

    public void deleteUserImage(User principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("user not found"));

        // 1) 기존 URL 백업
        final String prevUrl = user.getImgUrl();

        // 2) DB 값 먼저 null로 (변경감지로 UPDATE)
        user.updateImg(null);

        // 3) URL이 있던 경우에만, 커밋 후 S3 삭제
        if (StringUtils.hasText(prevUrl)) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() {
                    try {
                        awsS3Service.deleteFile(prevUrl); // ← 백업한 값을 사용
                        log.info("Deleted user image from S3: {}", prevUrl);
                    } catch (Exception ex) {
                        // 삭제 실패해도 DB는 이미 null 상태(멱등). 로그만 남김.
                        log.warn("Failed to delete user image from S3. url={}", prevUrl, ex);
                    }
                }
            });
        }
    }
}


