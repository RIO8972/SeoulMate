package com.knu.oauthlogin.domain.EmailVerification;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_verification")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailVerification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=255)
    private String email;

    @Column(name="code_hash", nullable=false, length=64)
    private byte[] codeHash; // SHA-256

    @Column(nullable=false)
    private LocalDateTime createdAt;

    @Column(nullable=false)
    private LocalDateTime expiresAt;

    private LocalDateTime usedAt;

    public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
    public boolean isUsed()    { return usedAt != null; }
}
