package com.knu.oauthlogin.controller.auth;

import com.knu.oauthlogin.service.token.JwtService;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import jakarta.servlet.http.Cookie;                    // ✅ 이거만 사용
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/token")
public class LogoutController {

    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        // 1) 쿠키에서 RT 꺼내기
        String rt = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("refreshToken".equals(c.getName())) {
                    rt = c.getValue();
                    break;
                }
            }
        }

        // 2) 서버 저장소에서 RT 폐기
        if (rt != null && !rt.isBlank()) {
            // 토큰 단건 삭제
            refreshTokenService.revokeByToken(rt);

            // (선택) 토큰 subject(여기선 userId/username)를 기준으로 혹시 남은 RT도 정리하고 싶으면:
            // String sub = jwtService.validateToken(rt).getBody().getSubject();
            // refreshTokenService.revokeByUsername(sub);
        }

        // 3) RT 쿠키 즉시 만료(프론트에서 접근 불가 HttpOnly)
        // 운영 도메인/개발 도메인 맞춰서 domain/sameSite/secure 조정.
        ResponseCookie expired = ResponseCookie.from("refreshToken", "")
                .path("/")
                // 운영 배포시:
                .domain(".seoul-mate.co.kr")
                .httpOnly(true)
                .secure(true)       // HTTPS일 때 true
                .sameSite("None")   // 프론트 도메인이 다르면 None
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, expired.toString());

        // (선택) 시큐리티 컨텍스트 클리어
        SecurityContextHolder.clearContext();

        return ResponseEntity.noContent().build();
    }
}
