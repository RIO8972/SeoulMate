package com.knu.oauthlogin.service.token;

import com.knu.oauthlogin.domain.refreshtoken.RefreshTokenRepository;
import com.knu.oauthlogin.domain.refreshtoken.RefreshToken;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    /**
     * 1) Refresh Token 생성 후 DB에 저장
     */
    public RefreshToken createRefreshToken(String username) {
        // 1-1) JWTService로 Refresh Token 문자열 생성
        String tokenStr = jwtService.generateRefreshToken(username);

        // 1-2) 만료 시각 계산 (Instant)
        Jws<Claims> claims = jwtService.validateToken(tokenStr);
        Instant expiry = claims.getBody().getExpiration().toInstant();

        // 1-3) 엔티티 생성 후 저장
        RefreshToken refreshToken = new RefreshToken(tokenStr, username, expiry);
        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * 2) DB + JWT 모두 유효한지 검증
     */
    public Optional<RefreshToken> verifyRefreshToken(String rawToken) {
        // 1) DB 조회
        Optional<RefreshToken> maybeToken = refreshTokenRepository.findByToken(rawToken);
        if (maybeToken.isEmpty()) {
            log.warn("[RefreshTokenService] DB에 토큰이 없습니다: {}", rawToken);
            return Optional.empty();
        }

        RefreshToken rtEntity = maybeToken.get();
        // 2) 만료 시간 검사
        if (rtEntity.getExpiryDate().isBefore(Instant.now())) {
            log.warn("[RefreshTokenService] 토큰이 만료되었습니다 (expiry={} now={}): {}",
                    rtEntity.getExpiryDate(), Instant.now(), rawToken);
            return Optional.empty();
        }

        // 3) JWT 서명/만료 검사
        try {
            jwtService.validateToken(rawToken);
        } catch (JwtException e) {
            log.warn("[RefreshTokenService] JWT 검증 실패: {} → {}", e.getMessage(), rawToken);
            return Optional.empty();
        }

        // 통과
        log.info("[RefreshTokenService] 리프레시 토큰 검증 통과: {}", rawToken);
        return Optional.of(rtEntity);

//        return refreshTokenRepository.findByToken(rawToken)
//                .filter(rt -> rt.getExpiryDate().isAfter(Instant.now()))
//                .filter(rt -> {
//                    try {
//                        jwtService.validateToken(rawToken);
//                        return true;
//                    } catch (JwtException e) {
//                        return false;
//                    }
//                });
    }

    public void revokeByToken(String token) {
        if (token == null || token.isBlank()) return;
        refreshTokenRepository.deleteByToken(token);
    }

    public void revokeByUsername(String username) {
        if (username == null || username.isBlank()) return;
        refreshTokenRepository.deleteByUsername(username);
    }
}
