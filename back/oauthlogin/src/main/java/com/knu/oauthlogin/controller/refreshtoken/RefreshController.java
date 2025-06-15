package com.knu.oauthlogin.controller.refreshtoken;

import com.knu.oauthlogin.domain.refreshtoken.RefreshToken;
import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.service.token.JwtService;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class RefreshController {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(
            HttpServletRequest request,
            HttpServletResponse response) {

        // 1) 쿠키에서 기존 리프레시 토큰(rawRefreshToken) 꺼내기
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
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", "리프레시 토큰이 없습니다."));
        }

        // 2) DB + JWT 검증
        Optional<RefreshToken> optionalRt = refreshTokenService.verifyRefreshToken(rawRefreshToken);
        if (optionalRt.isEmpty()) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", "리프레시 토큰이 유효하지 않습니다."));
        }

        // 3) 기존 토큰의 서브젝트(username)를 꺼내서 User 조회
        String subject = jwtService.validateToken(rawRefreshToken)
                .getBody()
                .getSubject();
        Long userId;
        try {
            userId = Long.valueOf(subject);
        } catch (NumberFormatException e) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", "잘못된 토큰 서브젝트입니다."));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: userId=" + userId));

        // 4) 새로운 Access Token 발급
        String newAccessToken = jwtService.generateAccessToken(
                user.getId().toString(),
                user.getUsername(),
                user.getEmail()
        );

        // 5) 새로운 Refresh Token 발급 및 DB 저장
        RefreshToken newRtEntity = refreshTokenService.createRefreshToken(user.getId().toString());
        String newRefreshToken = newRtEntity.getToken();
        long maxAge = (newRtEntity.getExpiryDate().toEpochMilli() - System.currentTimeMillis()) / 1000;

        // 6) Set-Cookie 헤더로 SameSite=None; Secure 쿠키 추가
        String cookieHeader = String.format(
                "refreshToken=%s; Domain=.seoul-mate.co.kr; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=%d",
                newRefreshToken,
                maxAge
        );

        // 7) 응답 헤더에 Set-Cookie 추가하고 Access Token 반환
        return ResponseEntity.ok()
                .header("Set-Cookie", cookieHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("accessToken", newAccessToken));
    }
}
