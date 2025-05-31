package com.knu.cityapi.cityapi.scheduler;
import com.knu.cityapi.cityapi.dto.region.RegionInfo;
import com.knu.cityapi.cityapi.service.seoul.SeoulRegionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;
@RequiredArgsConstructor
@Slf4j
@Service
public class SchedulerCacheService {
    private final SeoulRegionService seoulRegionService;
    // volatile로 최신 맵을 안전하게 유지
    private volatile Map<String, RegionInfo> cache = Map.of();

    @PostConstruct
    @Scheduled(fixedRate = 10 * 60 * 1000)  // 10분 = 600,000ms
    public void refreshCache() {
        seoulRegionService
                .getMaxCongestionByRegionWithColor()
                .doOnNext(latest -> {
                    this.cache = latest;
                    log.info("Congestion cache refreshed: {} entries", latest.size());
                })
                .subscribe();  // 논블로킹으로 실행
    }

    // 컨트롤러에서 이 메서드를 호출
    public Mono<Map<String, RegionInfo>> getCachedCongestion() {
        return Mono.just(cache);
    }
}
