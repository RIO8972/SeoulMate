package com.knu.cityapi.cityapi.apicontroller;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.dto.region.RegionInfo;
import com.knu.cityapi.cityapi.scheduler.SchedulerCacheService;
import com.knu.cityapi.cityapi.service.kakao.KakaoSearchService;
import com.knu.cityapi.cityapi.service.seoul.DistrictCacheAccessor;
import com.knu.cityapi.cityapi.service.seoul.SeoulRegionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class CityApiController {
    private final KakaoSearchService kakaoSearchService;
    private final SeoulRegionService seoulRegionService;
    private final SchedulerCacheService schedulerCacheService;
    private final DistrictCacheAccessor districtCacheAccessor;

    @GetMapping(value = "/search/kakao", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<String> search(@RequestParam String query,
                               @RequestParam(required = false, defaultValue = "15") int size,
                               @RequestParam(required = false, defaultValue = "1") int page
    ) {
        return kakaoSearchService.searchKeyword(query,size,page);
    }

    @GetMapping(value = "/search/seoul", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<JsonNode> seoul(@RequestParam String region) {
        //log.info("seoulController");
        return seoulRegionService.searchRegion(region);
    }

    /*
    @GetMapping(value = "/regions/population/color",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, RegionInfo>> getRegionsColor() { //캐싱데이터 호출
        return schedulerCacheService.getCachedCongestion();
    }*/
    @GetMapping(value = "/regions/color",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, RegionInfo>>> getCongestion() { //캐싱데이터
        return schedulerCacheService.getCachedColor()
                .map(map -> ResponseEntity.ok(map))
                .doOnError(e -> log.error("혼잡도 조회 중 오류 발생", e));
    }

    @GetMapping(value = "/regions/population/color2",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, RegionInfo>> getRegionsColor2() {
        return seoulRegionService.getMaxCongestionByRegionWithColor();
    }

    @PostMapping(
            value = "/regions/population",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, JsonNode>> getRegionsPopulation(
            @RequestBody List<String> regions) {
        log.info("dd");
        log.info(regions.toString());
        return seoulRegionService.searchRegionsAsMap(regions);
    }

    @GetMapping(value = "/regions/district",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public  Mono<Map<String, List<JsonNode>>>getDistrictPlaceData_cash() { //캐싱데이터
        return schedulerCacheService.getCachedDistrict()
                .doOnError(e -> log.error("혼잡도 조회 중 오류 발생", e));
    }

    @GetMapping(value = "/regions/get/district/{districtName}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public List<JsonNode> getDistrict( //캐싱데이터
            @PathVariable("districtName") String districtName) {

        return districtCacheAccessor.getCachedDistrictData(districtName);
    }

}
