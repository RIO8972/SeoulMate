package com.knu.oauthlogin.config.jwt;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;


@Configuration
public class JwtKeyConfig {
    @Value("${jwt.private-key-path}")
    private String privateKeyPath;

    @Value("${jwt.public-key-path}")
    private String publicKeyPath;

    private byte[] pemToDer(byte[] pemBytes, String begin, String end) {
        String pem = new String(pemBytes, StandardCharsets.UTF_8)
                .replace(begin, "")
                .replace(end, "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(pem);
    }

    @Bean
    public KeyPair jwtKeyPair() throws Exception {
        // 1) 파일시스템에서 PEM 파일 읽기
        byte[] privPem = Files.readAllBytes(Paths.get(privateKeyPath));
        byte[] pubPem  = Files.readAllBytes(Paths.get(publicKeyPath));


        // 2) PEM → DER 디코딩
        byte[] privDer = pemToDer(privPem,
                "-----BEGIN PRIVATE KEY-----", "-----END PRIVATE KEY-----");
        byte[] pubDer  = pemToDer(pubPem,
                "-----BEGIN PUBLIC KEY-----",  "-----END PUBLIC KEY-----");

        // 3) KeyFactory 로 RSA 키 객체 생성
        KeyFactory kf = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(privDer));
        PublicKey  publicKey  = kf.generatePublic (new X509EncodedKeySpec(pubDer));

        return new KeyPair(publicKey, privateKey);
    }
}

