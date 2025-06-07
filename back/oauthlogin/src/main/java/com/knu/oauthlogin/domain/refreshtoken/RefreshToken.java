package com.knu.oauthlogin.domain.refreshtoken;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.Instant;

@Getter
@ToString
@NoArgsConstructor
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 실제 JWT 문자열
    @Column(nullable = false, unique = true, length = 2048)
    private String token;

    // 토큰 소유자 식별값(예: 사용자 ID 또는 username)
    @Column(nullable = false)
    private String username;

    // 만료 시각 (Instant.ofEpochMilli)
    @Column(nullable = false)
    private Instant expiryDate;

    public RefreshToken(String token, String username, Instant expiryDate) {
        this.token = token;
        this.username = username;
        this.expiryDate = expiryDate;
    }
}
