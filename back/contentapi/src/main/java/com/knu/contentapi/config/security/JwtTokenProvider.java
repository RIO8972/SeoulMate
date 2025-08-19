package com.knu.contentapi.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
@Component
public class JwtTokenProvider {
    // RS256 검증에 사용할 공개키 (PEM 파일, JWK URL 등에서 로드)
    private final PublicKey publicKey;

    public JwtTokenProvider(@Value("${jwt.public-key-path}") String path) {
        try {
            Path p = path.startsWith("file:") ? Paths.get(URI.create(path)) : Paths.get(path);
            String pem = Files.readString(p, StandardCharsets.UTF_8);

            String body = pem.replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s+", "");
            byte[] der = Base64.getDecoder().decode(body);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(der);
            this.publicKey = KeyFactory.getInstance("RSA").generatePublic(spec);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load JWT public key from " + path, e);
        }
    }

    // 토큰 유효성 검사 (서명+만료)
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    // 토큰에서 subject(userId) 꺼내기
    public Long getUserId(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return Long.valueOf(claims.getSubject());
    }
}