package com.knu.contentapi.dto.users;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequestDto {
    private String username;
    //나중에 비밀번호 추가
}


