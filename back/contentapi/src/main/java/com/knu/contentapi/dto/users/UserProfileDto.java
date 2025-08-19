package com.knu.contentapi.dto.users;

import com.knu.contentapi.domain.review.Review;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.review.ReviewResponseDto;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {//응답용
    private Long id;
    private String email;
    private String username;
    private String imgUrl;
    // + 생성자, getter/setter

    public static UserProfileDto from(User user) { //id는 일단 null로
        return UserProfileDto.builder()
                .imgUrl(user.getImgUrl())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }
}

