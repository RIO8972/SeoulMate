package com.knu.contentapi.dto.reviewImg;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ReviewImgDto {
    private Long id;
    private String imgUrl;
}
