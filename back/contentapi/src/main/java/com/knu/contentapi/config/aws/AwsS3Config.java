package com.knu.contentapi.config.aws;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value; //import lombok.Value; 이거 쓰면 안됨
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Slf4j
@Configuration
@PropertySource("classpath:application-s3.properties")
public class AwsS3Config {
    /****
     전체적인 구현 내용
     1. AWS 자격증명
     properties에서 값을 읽어옴
     2. S3 클라이언트 설정
     AmazonS3Client() 객체 생성시 자격증명 설정(BasicAWSCredentials)
     3. S3 작업을 위한 클라이언트 제공
     amazonS3Client()메서드는 spring IoC컨테이너에 의해 관리되고 주입됨
     ****/

    //application-s3.properties 값 주입
    @Value("${cloud.aws.credentials.access-key}")
    private String accessKey;
    @Value("${cloud.aws.credentials.secret-key}")
    private String secretKey;
    @Value("${cloud.aws.region.static}")
    private String region;

    @Bean
    public AmazonS3Client amazonS3Client() {
        //BasicAWSCredentials AWS의 액세스 키와 비밀 키를 설정하는 객체
        BasicAWSCredentials awsCreds = new BasicAWSCredentials(accessKey, secretKey);

        /*
            AmazonS3ClientBuilder 이 빌더 클래스로 AmazonS3Client 객체를 구성
             S3 클라이언트를 설정하는데 필요한 옵션들을 설정할 수 있는 빌더 패턴 제공

             .withRegion(region): S3클라이언트가 연결할 AWS 리전을 설정
             .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
             AWS자격 증명(엑세스 키/비밀 키)
                AWSStaticCredentialsProvider로 basicAWSCredentials 객체(awsCreds)를
                통해 전달된 자격 증명을 사용하여 AWS 서비스와 상호작용을 할 수 있도록함
         */
        return (AmazonS3Client) AmazonS3ClientBuilder.standard()
                .withRegion(region)
                .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
                .build();
    }
}
