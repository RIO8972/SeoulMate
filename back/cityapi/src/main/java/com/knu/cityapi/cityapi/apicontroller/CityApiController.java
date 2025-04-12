package com.knu.cityapi.cityapi.apicontroller;

import com.knu.cityapi.cityapi.service.kakao.KakaoSearchService;
import com.knu.cityapi.cityapi.service.seoul.SeoulRegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

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
    public Mono<String> seoul(@RequestParam String region) {
        //log.info("seoulController");
        return seoulRegionService.searchRegion(region);
    }

}
