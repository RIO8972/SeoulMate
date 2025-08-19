package com.knu.contentapi.dto.review;

import com.knu.contentapi.dto.places.PlaceRequestDto;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ReviewUpdateRequestDto {
    private List<Long> deleteImgs;
    //private List<MultipartFile> images; //필요x 따로 이미지 받음

    private List<String> categories;
    private int cost;
    private String date;
    private Date datetime;       // yyyy-MM-dd 형식으로 바인딩
    private String detail;
    private String intro;
    private String region;
    private String time;
    private String title;
    private List<PlaceRequestDto> places;   // 추가
}
