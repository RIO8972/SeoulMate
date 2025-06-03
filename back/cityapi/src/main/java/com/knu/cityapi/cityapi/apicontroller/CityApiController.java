package com.knu.cityapi.cityapi.apicontroller;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.dto.region.RegionInfo;
import com.knu.cityapi.cityapi.scheduler.SchedulerCacheService;
import com.knu.cityapi.cityapi.service.kakao.KakaoSearchService;
import com.knu.cityapi.cityapi.service.odsay.RouteDurationService;
import com.knu.cityapi.cityapi.service.seoul.DistrictCacheAccessor;
import com.knu.cityapi.cityapi.service.seoul.SeoulRegionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
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
    private  final RouteDurationService routeDurationService;

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

    @GetMapping(value = "/cache/regions/population/colors",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, RegionInfo>>> getCongestion() { //캐싱데이터
        return schedulerCacheService.getCachedColor()
                .map(map -> ResponseEntity.ok(map))
                .doOnError(e -> log.error("혼잡도 조회 중 오류 발생", e));
    }

    @GetMapping(value = "/regions/population/colors",
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

    @GetMapping(value = "/cache/regions/population/districts",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public  Mono<Map<String, List<JsonNode>>>getDistrictPlaceData_cash() { //캐싱데이터
        return schedulerCacheService.getCachedDistrict()
                .doOnError(e -> log.error("혼잡도 조회 중 오류 발생", e));
    }

    @GetMapping(value = "/cache/regions/population/districts/{districtName}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public List<JsonNode> getDistrict( //캐싱데이터
            @PathVariable("districtName") String districtName) {

        return districtCacheAccessor.getCachedDistrictData(districtName);
    }

    @GetMapping(value = "/search/route",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<JsonNode> searchRoute(
            @RequestParam String mode,         // "car" 또는 "public-transport"
            @RequestParam String start_x,
            @RequestParam String start_y,
            @RequestParam String end_x,
            @RequestParam String end_y
    ) {
        // mode 값에 따라 서비스 호출을 분기
        if ("car".equalsIgnoreCase(mode)) {
            // 카카오 내비 API는 "경도,위도" 한 문자열로 넘겨야 하므로 두 값을 합침
            String start_xy = start_x + "," + start_y;
            String end_xy   = end_x   + "," + end_y;
            return kakaoSearchService.searchRouteCar(start_xy, end_xy);

        } else if ("public-transport".equalsIgnoreCase(mode)
                || "publictransport".equalsIgnoreCase(mode)) {
            // 대중교통은 start_x, start_y, end_x, end_y 그대로 사용
            return routeDurationService.searchRoutePublicTransport(
                    start_x, start_y, end_x, end_y);

        } else {
            return Mono.error(new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "지원하지 않는 mode 값입니다. (car 또는 public-transport)"));
        }
    }

}
