package com.knu.cityapi.cityapi.controller.cash.citydata;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.scheduler.citydata.CityCacheScheduler;
import com.knu.cityapi.cityapi.service.seoul.DistrictCacheAccessor;
import com.knu.cityapi.cityapi.service.seoul.SeoulCityDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@RestController
public class CityCashController {
    private final SeoulCityDataService seoulCityDataService;
    private final CityCacheScheduler cityCacheScheduler;
    private final DistrictCacheAccessor districtCacheAccessor;

    @GetMapping(value = "/cityapi", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<JsonNode> seoul(@RequestParam("region") String region) {
        return seoulCityDataService.searchRegion(region);
    }

    @GetMapping(value = "/cache/regions/city/districts/places", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, JsonNode>> seoulregions() {
        return seoulCityDataService.getAllRawDataByRegion();
    }


    @GetMapping(value = "/cache/regions/city/districts/",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<List<JsonNode>> seoulCitiesData() {
        return cityCacheScheduler.getCachedCity()
                .doOnError(e -> log.error("혼잡도 조회 중 오류 발생", e));
    }

    @GetMapping(value = "/cache/regions/city/districts/{regionCode}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public JsonNode getSeoulCityData( @PathVariable("regionCode") String regionCode){
        return districtCacheAccessor.getCityData(regionCode);
    }
}
