package com.knu.cityapi.cityapi.scheduler;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.dto.region.RegionInfo;
import com.knu.cityapi.cityapi.service.seoul.SeoulRegionService;
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
import java.util.Map;
@RequiredArgsConstructor
@Slf4j
@Service
public class SchedulerCacheService {
    private final SeoulRegionService seoulRegionService;
    private final CacheManager cacheManager;

    /**
     * 10분마다 강제로 캐시값을 미리 채워 놓기
     */
    @Scheduled(fixedRate = 10 * 60 * 1000)  // 10분 = 600,000ms
    public void refreshCacheForced() {
        CaffeineCache colorCache = (CaffeineCache) cacheManager.getCache("colorCache");
        if (colorCache == null) {
            log.warn("regionsCache 캐시가 등록되지 않음");
            return;
        }
        seoulRegionService.getMaxCongestionByRegionWithColor()
                .doOnNext(latest -> {
                    // SimpleKey.EMPTY는 파라미터가 없는 @Cacheable 호출의 기본 키
                    colorCache.put(SimpleKey.EMPTY, latest);
                    log.info("강제 스케줄러로 캐시 업데이트: {} entries", latest.size());
                })
                .subscribe();  // Reactor 비동기 방식으로 처리

        CaffeineCache districtCache = (CaffeineCache) cacheManager.getCache("districtCache");
        if (districtCache == null) {
            log.warn("districtCache 캐시가 등록되지 않음");
            return;
        }
        seoulRegionService.getAllRawDataByRegion()
                .doOnNext(latest -> {

                    districtCache.put(SimpleKey.EMPTY, latest);
                    log.info("강제 스케줄러로 캐시 업데이트: {} entries", latest.size());
                })
                .subscribe();  // Reactor 비동기 방식으로 처리
    }

    @Cacheable(value = "colorCache")
    public Mono<Map<String, RegionInfo>> getCachedColor() {
        log.info("캐시 미스 발생: 실제 조회 호출");
        return seoulRegionService.getMaxCongestionByRegionWithColor();
    }

    @Cacheable(value = "districtCache")
    public Mono<Map<String, List<JsonNode>>> getCachedDistrict() {
        log.info("캐시 미스 발생: 실제 조회 호출");
        return seoulRegionService.getAllRawDataByRegion();
    }

}
