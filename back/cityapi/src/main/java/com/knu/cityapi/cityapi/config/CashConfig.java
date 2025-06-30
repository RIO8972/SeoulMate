package com.knu.cityapi.cityapi.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CashConfig {
    @Bean
    public CaffeineCacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("colorCache","districtCache","cityCache");

        cacheManager.setAsyncCacheMode(true); //비동기 캐시 모드 활성화

        cacheManager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(10, TimeUnit.MINUTES)   // 쓰기 시점으로부터 10분 후 만료 TTL설정
                        .maximumSize(1000)                        // 최대 엔트리 개수 (필요에 따라 조정)
                        .recordStats()                            // 통계를 원하면 활성화
        );
        return cacheManager;
    }
}
