package com.knu.oauthlogin.service.token;
import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.swing.*;
import java.security.KeyPair;
import java.util.Date;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.security.KeyPair;
import java.util.Date;

@Service
public class JwtService {
    private final JwtParser parser;
    private final JwtBuilder builder;

    private final long accessExpMs;
    private final long refreshExpMs;

    public JwtService(
            KeyPair jwtKeyPair,
            @Value("${jwt.access-expiration}") long accessExpMs,
            @Value("${jwt.refresh-expiration}") long refreshExpMs
    ) {
        // 공개키로 검증용 파서(parser) 생성
        this.parser = Jwts.parserBuilder()
                .setSigningKey(jwtKeyPair.getPublic())
                .build();
        // 개인키로 서명용 빌더(builder) 생성
        this.builder = Jwts.builder()
                .signWith(jwtKeyPair.getPrivate(), SignatureAlgorithm.RS256);

        this.accessExpMs = accessExpMs;
        this.refreshExpMs = refreshExpMs;
    }

    /**
     * Access Token 발급
     * subject: 사용자 식별값(예: userId)
     * name, email: 추가 claim
     */
    public String generateAccessToken(String subject, String name, String email) {
        Date now = new Date();
        return builder
                .setSubject(subject) //이거 user_id 값임(user테이블 id 컬럼 값)
                .claim("name", name)
                .claim("email", email)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + accessExpMs))
                .compact();
    }

    /**
     * Refresh Token 발급
     * subject: 사용자 식별값(예: userId)
     * 보안상 Refresh Token에는 claim을 최소화하는 것이 일반적입니다.
     */
    public String generateRefreshToken(String subject) {
        Date now = new Date();
        return builder
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + refreshExpMs))
                .compact();
    }

    /** 토큰 검증(서명+만료) 후 Claims 반환 **/
    public Jws<Claims> validateToken(String token) throws JwtException {
        return parser.parseClaimsJws(token);
    }

    // (Optional) 토큰 만료 시간 조회용 Getter
    public long getRefreshExpMs() {
        return refreshExpMs;
    }
}
