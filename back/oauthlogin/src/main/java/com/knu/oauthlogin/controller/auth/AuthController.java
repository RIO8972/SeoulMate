package com.knu.oauthlogin.controller.auth;

import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.dto.user.LoginRequestDto;
import com.knu.oauthlogin.dto.user.SignupRequestDto;
import com.knu.oauthlogin.service.auth.UserService;
import com.knu.oauthlogin.service.token.JwtService;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthenticationManager authManager;
    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@RequestBody SignupRequestDto dto) {
        userService.register(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto dto) {
        log.info(">>local_login {}", dto);
        Authentication auth;
        try {
            auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
            );
            log.info(">>access-----> auth OK for [{}]", dto.getEmail());
        } catch (AuthenticationException ex) {
            log.error("🔐 로그인 실패: {}", ex.getMessage(), ex);
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인 실패: " + ex.getMessage()));
        }

        // 인증 성공 시 DB에서 User 엔티티 조회 (provider="LOCAL")
        User user = userRepository.findByEmailAndProvider(dto.getEmail(), "LOCAL")
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + dto.getEmail()));

        // Access Token 생성
        String accessToken = jwtService.generateAccessToken(
                user.getId().toString(),
                user.getUsername(),
                user.getEmail()
        );

        // Refresh Token 생성 및 저장
        String refreshToken = jwtService.generateRefreshToken(user.getId().toString());
        refreshTokenService.createRefreshToken(user.getId().toString());

        // 토큰 반환
        return ResponseEntity.ok(Map.of(
                "accessToken",  accessToken,
                "refreshToken", refreshToken
        ));
    }
}