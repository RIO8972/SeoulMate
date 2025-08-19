package com.knu.contentapi.service.aws;

import com.amazonaws.AmazonClientException;
import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AwsS3Service {
    @Value("${cloud.aws.s3.bucket}")
    private String bucket;


    //@Bean으로 등록한 amazonS3Client() 메서드는 Spring이 관리하는 빈(Bean) 이고,
    //private final AmazonS3 amazonS3;는 그 빈을 주입받은 필드
    private final AmazonS3 amazonS3;

    /*
    public List<String> uploadFile(List<MultipartFile> multipartFiles){
        List<String> fileNameList = new ArrayList<>();

        // forEach 구문을 통해 multipartFiles 리스트로 넘어온 파일들을 순차적으로 fileNameList 에 추가
        multipartFiles.forEach(file -> {
            String fileName = createFileName(file.getOriginalFilename());
            ObjectMetadata objectMetadata = new ObjectMetadata();
            objectMetadata.setContentLength(file.getSize());
            objectMetadata.setContentType(file.getContentType());

            try(InputStream inputStream = file.getInputStream()){
                amazonS3.putObject(new PutObjectRequest(bucket, fileName, inputStream, objectMetadata)
                        .withCannedAcl(CannedAccessControlList.PublicRead));
            } catch (IOException e){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다.");
            }
            fileNameList.add(fileName);

        });

        return fileNameList;
    }*/


    public String uploadFile(MultipartFile multipartFile){
        //MultipartFile
        //파일의 실제 데이터를 직접 담고 있는 객체는 아니고, 파일의 정보와 파일에 접근할 수 있는 방법을 제공
        //실제 파일 데이터는 따로 메모리에 저장하고 MultipartFile객체는 메타데이터를
        // 담고 있으며 실제 데이터를 조회할 수 있는 메서드를 가지고 있
        if (multipartFile == null || multipartFile.isEmpty()) {
            log.info("faillUrl____");
            return null;
        }

        //새로운 파일 이름 지정(createFileName에 추가 설명)
        String fileName = createFileName(multipartFile.getOriginalFilename());
        //파일 메타데이터 생성
        /*
            메타데이터란? 데이터의 대한 설명 정보
            ex) 파일A의 메타데이터
                - 파일크기 / - 파일형식 / -파일 생성,수정일 / -파일이름 등등
         */
        //ObjectMetadata는 클래스는 Amazon S3와 같은 클라우드 스토리지에서 파일을
        // 업로드하거나 다운로드할 때,파일의 메타데이터를 설정할 수 있는 클래스
        ObjectMetadata objectMetadata = new ObjectMetadata();
        //업로드할 파일의 크기를 바이트 단위로 설정(업로드 할 파일의 크기로)
        objectMetadata.setContentLength(multipartFile.getSize());
        //파일의 콘텐츠 타입을 설정. 예를 들어, 이미지 파일이면
        // "image/png", "image/jpeg" 등의 값이 될 수 있음 (업로드 파일 타입)
        objectMetadata.setContentType(multipartFile.getContentType());

        //multipartFile.getInputStream()스트림 : 업로드할 파일의 입력 스트림을 가져옴
        try(InputStream inputStream = multipartFile.getInputStream()){
            //getInputStream() 메서드를 호출하면, **파일의 바이너리 데이터(실제 내용)**를 읽을 수 있는 스트림을 반환
            /*
                따라서 이구문은
                InputStream inputStream = multipartFile.getInputStream();
                여기서 multipartFile 아까 여기에 설정했던 메타데이터에 맞는 파일을 읽을 수 있는 입력 스트림 객체를 생성해서 참조하는 구문
             */
            //amazonS3.putObject(new PutObjectRequest(bucket, fileName, inputStream, objectMetadata)
            //        .withCannedAcl(CannedAccessControlList.PublicRead));

            //PutObjectRequest는 S3버킷에 파일을 업로드하는 요청객체
            /*
                bucket: 업로드할 대상으로 S3버킷에 파일을 업로드하는 요청 객체
                fileName : 파일 원본 이름
                objectMetadata: 파일에 대한 메타데이터
                amazonS3.putObject : 이 메서드는 파일을 S3로 올리는 작업을 수행함
             */
            //putObject 메서드로 inputStream을 이용해 S3파일에 데이터 업로드
            //PutObjectRequest는 S3에 파일을 업로드하기 위한 요청 객체

            amazonS3.putObject(new PutObjectRequest(bucket, fileName, inputStream, objectMetadata));

        } catch (IOException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다.");
        }

        //저장 성공시 이름반환
        //return fileName;
        // 4) 업로드된 객체의 HTTPS URL 얻기
        URL url = amazonS3.getUrl(bucket, fileName);
        return url.toString();   // → https://버킷명.s3.리전.amazonaws.com/파일명.png
    }
    public List<String> uploadFiles(List<MultipartFile> multipartFiles) {
        if (multipartFiles == null || multipartFiles.isEmpty()) {
            log.info("no files to upload");
            return Collections.emptyList();
        }

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : multipartFiles) {
            if (file.isEmpty()) {
                continue;  // 비어 있는 파일은 건너뜀
            }

            String fileName = createFileName(file.getOriginalFilename()); //원본 이름에 UUID 등을 붙여 고유한 S3 객체 키(key)로 만듦
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());

            try (InputStream is = file.getInputStream()) {
                PutObjectRequest request =
                        new PutObjectRequest(bucket, fileName, is, metadata);
                // ACL 대신 버킷 정책으로 퍼블릭 허용 중이라면 아래 줄 생략
                // .withCannedAcl(CannedAccessControlList.PublicRead);
                amazonS3.putObject(request); //실제 업로드
            } catch (IOException e) {
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "파일 업로드에 실패했습니다: " + file.getOriginalFilename(), e
                );
            }

            // 업로드 후 URL 생성
            URL url = amazonS3.getUrl(bucket, fileName);
            urls.add(url.toString());
        }

        return urls;
    }



    //UUID 파일명 생성 메서드
    public String createFileName(String fileName){
        // UUID.randomUUID().toString()로 uuid 객체 생성 + getFileExtension으로 확장자 추가
        // => 새로운 파일명.확장자 반환
        return UUID.randomUUID().toString().concat(getFileExtension(fileName));
        //getFileExtension는 파일 확장자 붙여줌 ex) "image.png"
        // .concat로 마지막에 파일명 붙여줌
        /*
            1c90aa54-f3d1-431d-977e-fbc1e1328ed6.png (UUID 방식)
            이렇게하는 이유?
                1. 파일이름중복 방지
                2. 보안(이름으로 파일 유추 방지)
                3. 일관된 이름으로 유지/보수 용이
                4. 검색 최적화
            +)
            UUID란? "범용 고유 식별자"로, 네트워크 상에서 고유한 값을 생성하는 방법
            => 고유한 식별자가 필요할 때 사용함 ( 파일이름 / db 항목실별 / 세션 ID)
         */
    }

    //  "."의 존재 유무만 판단 => 파일 확장자 추출 메서드
    private String getFileExtension(String fileName){
        try{
            return fileName.substring(fileName.lastIndexOf("."));
        } catch (StringIndexOutOfBoundsException e){ //.없으면 예외 던짐
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 형식의 파일" + fileName + ") 입니다.");
        }
    }


    public void deleteFile(String fileUrl){ //이미지 url을 파라미터로 받음
        // bucket : 삭제할 s3버캣 이름 / fileName : s3버캣에 저장된 파일
        if (fileUrl.startsWith("http")) {
            try {
                URL url = new URL(fileUrl);
                String path = url.getPath();                   // "/fb9667c1-…-ced.png"
                fileUrl = path.substring(path.lastIndexOf('/') + 1);
            } catch (MalformedURLException e) {
                log.error("잘못된 URL 포맷: {}", fileUrl, e);
                // key 추출 실패 시 그냥 원본 사용하거나 예외 처리
            }
        }
        try {
            amazonS3.deleteObject(new DeleteObjectRequest(bucket, fileUrl));
            System.out.println("File " + fileUrl + " has been deleted from bucket " + bucket);
        } catch (AmazonServiceException e) {
            System.err.println("AmazonServiceException: " + e.getMessage());
        } catch (AmazonClientException e) {
            System.err.println("AmazonClientException: " + e.getMessage());
        }
        //amazonS3.deleteObject(new DeleteObjectRequest(bucket, fileName));
        //System.out.println(bucket);
    }

    public String readFile(String fileName) {
        try {
            //S3Object란? Amazon S3에서 가져온 객체(파일) 정보와 파일 데이터(InputStream)를 포함한 클래스
            S3Object s3Object = amazonS3.getObject(bucket, fileName);
            //url을 반환하기
            URL fileUrl = amazonS3.getUrl(bucket, fileName);
            return fileUrl.toString();
        }
        catch (AmazonServiceException e) {
            System.err.println("AmazonServiceException: " + e.getMessage());
            return null;
        } catch (AmazonClientException e) {
            System.err.println("AmazonClientException: " + e.getMessage());
            return null;
        }
    }

    /** 신규: 업로드 결과(Key + URL) DTO */
    @Getter
    @AllArgsConstructor
    public static class S3PutResult {
        private String key;
        private String url;
    }

    /** 파일 1개 업로드 → Key + URL 함께 반환 */
    public S3PutResult uploadFileReturnKeyAndUrl(MultipartFile multipartFile){
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "빈 파일");
        }
        String key = createFileName(multipartFile.getOriginalFilename()); // key = 파일명(=경로)
        ObjectMetadata md = new ObjectMetadata();
        md.setContentLength(multipartFile.getSize());
        md.setContentType(multipartFile.getContentType());

        try (InputStream is = multipartFile.getInputStream()) {
            amazonS3.putObject(new PutObjectRequest(bucket, key, is, md));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드 실패");
        }

        String url = amazonS3.getUrl(bucket, key).toString();
        return new S3PutResult(key, url);
    }

    /** 파일 여러 개 업로드 → Key + URL 리스트 반환 */
    public List<S3PutResult> uploadFilesReturnKeyAndUrl(List<MultipartFile> multipartFiles) {
        if (multipartFiles == null || multipartFiles.isEmpty()) return Collections.emptyList();
        List<S3PutResult> results = new ArrayList<>();
        for (MultipartFile file : multipartFiles) {
            if (file == null || file.isEmpty()) continue;
            results.add(uploadFileReturnKeyAndUrl(file));
        }
        return results;
    }

    /** Key로 삭제 (URL 파싱 불필요) */
    public void deleteByKey(String key) {
        try {
            amazonS3.deleteObject(new DeleteObjectRequest(bucket, key));
            log.info("Deleted s3://{}/{}", bucket, key);
        } catch (AmazonClientException e) { // Service + Client 모두 포함
            log.error("S3 delete failed: {}", key, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "S3 삭제 실패", e);
        }
    }

    /** Key → 공개 URL 생성 (필요 시 응답 DTO 만들 때 사용) */
    public String toPublicUrl(String key) {
        return amazonS3.getUrl(bucket, key).toString();
    }

}
