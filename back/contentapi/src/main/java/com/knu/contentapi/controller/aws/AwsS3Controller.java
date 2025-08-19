package com.knu.contentapi.controller.aws;
import com.knu.contentapi.domain.review.ReviewRepository;
import com.knu.contentapi.domain.reviewImg.ReviewImg;
import com.knu.contentapi.domain.reviewImg.ReviewImgRepository;
import com.knu.contentapi.service.aws.AwsS3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequiredArgsConstructor
@RequestMapping("/file")
@Slf4j
public class AwsS3Controller {

    private final AwsS3Service awsS3Service;
    private final ReviewImgRepository reviewImgRepository;

    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadFile(MultipartFile multipartFile) {
        // 업로드 처리 후 반환할 데이터 구성
        String fileUrl = awsS3Service.uploadFile(multipartFile);

        // 응답 바디에 파일 URL과 상태 메시지를 포함
        Map<String, Object> response = new HashMap<>();
        response.put("fileUrl", fileUrl);
        response.put("message", "File uploaded successfully");

        return ResponseEntity.ok(response); // 응답 바디와 함께 상태 코드 200 반환
    }
    @PostMapping("/upload")
    public ResponseEntity<List<String>> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files) { //MultipartFile로 이미지 파일들 받아서
        List<String> uploadedUrls = awsS3Service.uploadFiles(files); //업로드 로직 처리
        for(String url : uploadedUrls){
            reviewImgRepository.save(
                   ReviewImg.builder()
                           .imgUrl(url)
                           .build()
            );
        }
        return ResponseEntity.ok(uploadedUrls);
    }



    @DeleteMapping
    public ResponseEntity<String> deleteFile(@RequestParam String fileName){
        // +) 삭제 시에(fileName) .png 이렇게 이름 + 확장자까지 url 파리미터에 넣어줘야함
        awsS3Service.deleteFile(fileName);
        return ResponseEntity.ok(fileName);
    }

    @GetMapping
    public ResponseEntity<String> readFile(@RequestParam String fileName){
        return ResponseEntity.ok("url--> "+awsS3Service.readFile(fileName)); //내가 받을 매세지

    }

}
