package com.knu.cityapi.cityapi.scheduler.citydata;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.service.seoul.SeoulCityDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@Service
public class CityCacheScheduler {
    private final CacheManager cacheManager;
    private final
    SeoulCityDataService seoulCityDataService;

    @Scheduled(fixedRate = 10 * 60 * 1000)  // 10분 = 600,000ms  //잠깐만 비활성
    public void refreshCacheForced() {
        CaffeineCache cityCache     = (CaffeineCache) cacheManager.getCache("cityCache");

        if (cityCache == null) {
            log.warn("cityCache 캐시가 등록되지 않음");
            return;
        }
        seoulCityDataService.getAllDataByRegion()  // Mono<List<JsonNode>>
                .doOnSuccess(cityList -> {
                    cityCache.put(SimpleKey.EMPTY, cityList);
                    log.info("cityCache 업데이트: {} entries", cityList.size());
                })
                .doOnError(err ->
                        log.error("스케줄러 — cityCache 갱신 실패", err)
                )
                .subscribe();
    }
    @Cacheable(value = "cityCache")
    public Mono<List<JsonNode>> getCachedCity() {
        log.info("캐시 미스 발생: 실제 조회 호출");
        return seoulCityDataService.getAllDataByRegion();
    }
}
