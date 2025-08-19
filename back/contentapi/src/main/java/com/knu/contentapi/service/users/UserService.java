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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {
    final private UserRepository userRepository;
    final private AwsS3Service awsS3Service;

    public void updateUserImage(User user, UserUpdateRequestDto dto, MultipartFile image) {
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
        if (dto.getUsername() != null) { user.updateUserName(dto.getUsername()); }
        userRepository.save(user);
    }
}


