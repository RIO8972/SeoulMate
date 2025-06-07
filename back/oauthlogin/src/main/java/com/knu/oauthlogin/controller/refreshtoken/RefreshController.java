package com.knu.oauthlogin.controller.refreshtoken;

import com.knu.oauthlogin.domain.refreshtoken.RefreshToken;
import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.service.token.JwtService;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.Cookie;

import java.util.Map;
import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class RefreshController {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    //private final UserDetailsService userDetailsService; // UserDetailsService 구현체 (username→UserDetails)
    private final UserRepository userRepository;

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(HttpServletRequest request,
                                                HttpServletResponse response) throws IOException {
        // 1) 쿠키에서 refreshToken 가져오기
        String rawRefreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("refreshToken".equals(c.getName())) {
                    rawRefreshToken = c.getValue();
                    break;
                }
            }
        }
        if (rawRefreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "리프레시 토큰이 없습니다."));
        }

        // 2) DB + JWT 유효성 검사
        Optional<RefreshToken> optionalRt = refreshTokenService.verifyRefreshToken(rawRefreshToken);
        if (optionalRt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "리프레시 토큰이 유효하지 않습니다."));
        }

        // 3) 토큰 페이로드에서 username(subject, 여기서는 userId) 추출
        String username = jwtService.validateToken(rawRefreshToken).getBody().getSubject();
        Long userId;
        try {
            userId = Long.valueOf(username);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "잘못된 토큰 서브젝트입니다."));
        }

        // 4) UserRepository로 사용자 조회 (email 대신 ID로 조회)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: userId=" + userId));

        // 5) 새로운 Access Token 발급 (필요한 필드를 직접 넣어주면 됨)
        String newAccessToken = jwtService.generateAccessToken(
                user.getId().toString(),
                user.getUsername(),  // 또는 이름(name) 필드가 있다면 그 값을
                user.getEmail()
        );

        // 6) JSON 바디로 새 Access Token 반환
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }
}
