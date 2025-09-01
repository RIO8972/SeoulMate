package com.knu.oauthlogin.service.passwordCange;

import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public void changeLocalPassword(User user, String currentPassword, String newPassword) {
        // 1) LOCAL만 허용
        if (!"LOCAL".equalsIgnoreCase(user.getProvider())) {
            throw new IllegalStateException("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        }
        // 2) 현재 비밀번호 일치 검사
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadCredentialsException("현재 비밀번호가 일치하지 않습니다.");
        }
        // 3) 새 비밀번호 정책
        validateStrength(newPassword);

        // 4) 이전과 동일한 비번 금지(선택)
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("이전과 다른 비밀번호를 사용하세요.");
        }

        // 5) 저장
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 6) 리프레시 토큰 전부 삭제(강제 재로그인)
        try {
            // 프로젝트에 맞는 메서드로 정리 (by userId / by email 등)
            refreshTokenService.revokeByUsername(user.getEmail());
        } catch (Exception e) {
            log.warn("RefreshToken cleanup failed for userId={}", user.getId(), e);
        }
    }

    private void validateStrength(String pwd) {
        // 최소 요건 예시: 8자 이상, 영문/숫자 포함
        if (pwd.length() < 8 ||
                !pwd.matches(".*[A-Za-z].*") ||
                !pwd.matches(".*\\d.*")) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.");
        }
    }
}
