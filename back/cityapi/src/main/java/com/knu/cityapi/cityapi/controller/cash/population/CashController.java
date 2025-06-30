package com.knu.cityapi.cityapi.controller.cash.population;


import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.dto.region.DistrictResponse;
import com.knu.cityapi.cityapi.dto.region.RegionInfo;
import com.knu.cityapi.cityapi.scheduler.population.SchedulerCacheService;
import com.knu.cityapi.cityapi.service.seoul.DistrictCacheAccessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@RestController
public class CashController {
    private final SchedulerCacheService schedulerCacheService;
    private final DistrictCacheAccessor districtCacheAccessor;


    @GetMapping(value = "/cache/regions/population/districts",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, List<JsonNode>>> getDistrictPlaceData_cash() { //지역구별 분류(전체 데이터)
        return schedulerCacheService.getCachedDistrict()
                .doOnError(e -> log.error("혼잡도 조회 중 오류 발생", e));
    }

    @GetMapping(value = "/cache/regions/population/districts/{districtName}/places",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public List<JsonNode> getCachedDistrictPlaces( //지역구 선택 조회 (장소만 보내줌)
                                       @PathVariable("districtName") String districtName) {

        return districtCacheAccessor.getCachedDistrictPlaces(districtName);
    }

    @GetMapping(value = "/cache/regions/population/districts/{districtName}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public DistrictResponse getCachedDistrictResponse( //지역구 선택 조회 (장소 + 지역구 코드, 이름)
                                                       @PathVariable("districtName") String districtName) {

        return districtCacheAccessor.getCachedDistrictResponse(districtName);
    }

    @GetMapping(value = "/cache/regions/population/colors",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, RegionInfo>>> getCongestion() { //캐싱데이터
        return schedulerCacheService.getCachedColor()
                .map(map -> ResponseEntity.ok(map))
                .doOnError(e -> log.error("혼잡도 조회 중 오류 발생", e));
    }

}
