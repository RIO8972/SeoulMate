package com.knu.oauthlogin.dto.user;

import lombok.Getter;
import com.knu.oauthlogin.domain.user.User;


@Getter
public class UserProfile{
    private String username;
    private String provider; // 로그인한 서비스
    //private String providerId; //사용자 식별자
    private String email;

    public void setUserName(String userName) {
        this.username = userName;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public void setProvider(String provider) {
        this.provider = provider;
    }

    public User toEntity() {
        return User.builder()
                .username(this.username)
                .email(this.email)
                .provider(this.provider)
                .build();
    }
}
