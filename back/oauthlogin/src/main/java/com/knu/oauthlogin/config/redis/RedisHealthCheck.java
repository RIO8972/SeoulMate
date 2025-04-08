package com.knu.oauthlogin.config.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisHealthCheck implements CommandLineRunner {
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void run(String... args) throws Exception {
        String result = redisTemplate.getConnectionFactory().getConnection().ping();
        System.out.println("Redis 연결 확인: " + result);  // PONG 나와야 정상
    }
}

