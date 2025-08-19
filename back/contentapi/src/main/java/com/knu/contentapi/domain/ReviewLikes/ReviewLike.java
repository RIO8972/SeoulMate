package com.knu.contentapi.domain.ReviewLikes;

import com.knu.contentapi.domain.review.Review;
import com.knu.contentapi.domain.users.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "review_likes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "review_id"}),
        indexes = {
                @Index(name = "idx_review_likes_user", columnList = "user_id"),
                @Index(name = "idx_review_likes_review", columnList = "review_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ReviewLike {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // cascade 지정하지 않음(좋아요가 부모 생명주기를 좌우하면 안 됨)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // cascade 지정하지 않음
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

