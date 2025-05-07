package com.knu.cityapi.cityapi.apicontroller;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.service.kakao.KakaoSearchService;
import com.knu.cityapi.cityapi.service.seoul.SeoulRegionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
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

}
