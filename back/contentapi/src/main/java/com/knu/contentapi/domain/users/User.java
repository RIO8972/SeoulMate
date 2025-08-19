package com.knu.contentapi.domain.users;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicUpdate;

@Entity
@Getter
@ToString
@DynamicUpdate // Entity update시, 원하는 데이터만 update하기 위함
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@Table(name="USERS")//USER는 얘약어 -> USERS사용
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "user_id")
    private Long id;
    @Column(name = "username", nullable = false)
    private String username; // 로그인한 사용자의 이름
    @Column(name = "email", nullable = false)
    private String email; // 로그인한 사용자의 이메일
    @Column(name = "provider", nullable = false)
    private String provider; // 사용자가 로그인한 서비스(ex) google, naver..)
    @Column
    private String password; // 로컬 로그인용 비밀번호
    @Column(name = "img_url", length = 512)
    private String imgUrl;

    public void updateImg(String imgUrl) { this.imgUrl = imgUrl; }
    public void updateUserName(String username) { this.username = username; }
}