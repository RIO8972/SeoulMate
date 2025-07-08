package com.knu.oauthlogin.dto.user;

import lombok.*;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginRequestDto {
    private String email;
    private String password;
}