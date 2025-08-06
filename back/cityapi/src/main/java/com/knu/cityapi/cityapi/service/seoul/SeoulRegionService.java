package com.knu.cityapi.cityapi.service.seoul;


import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlaceRepository;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlace;
import com.knu.cityapi.cityapi.dto.region.RegionInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;
import reactor.util.retry.Retry;
import reactor.util.retry.RetryBackoffSpec;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeoulRegionService {
    private final SeoulPlaceRepository seoulPlaceRepository;
    private  final WebClient webClient = WebClient.builder().baseUrl("http://openapi.seoul.go.kr:8088/").build();

    // retry 스펙: 최대 3회, 실패마다 2초씩 backoff
    private final RetryBackoffSpec RETRY_SPEC = Retry.backoff(3, Duration.ofSeconds(2))
            .filter(throwable -> {
                // 네트워크 에러나 5xx 에만 재시도
                return !(throwable instanceof IllegalArgumentException);
            })
            .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) ->
                    retrySignal.failure()
            );

    @Cacheable("allPlaces")
    public List<String> getAllPlaceNames() {
        return seoulPlaceRepository.findAll()
                .stream()
                .map(SeoulPlace::getPlaceName)
                .collect(Collectors.toList());
    }

    @Value("${seoul.api.key}")
    private String seoulApiKey;

    private String decideColor(String lvl) {
        return switch (lvl) {
            case "붐빔"      -> "#4C75A3";
            case "약간 붐빔" -> "#6C97BF";
            case "보통"      -> "#89ADD3";
            case "여유"      -> "#C3E1F3";
            default          -> "#C3E1F3";
        };
    }

    private int priority(String lvl) {
        return switch (lvl) {
            case "붐빔"      -> 4;
            case "약간 붐빔" -> 3;
            case "보통"      -> 2;
            case "여유"      -> 1;
            default          -> 0;
        };
    }

//    public Mono<JsonNode> searchRegion(String region){
//        //log.info("region : "+ region);
//        //log.info("seoulApiKey :"+ seoulApiKey);
//        return webClient.get()
//                .uri(uriBuilder -> uriBuilder
//                        .path("/{apiKey}/json/citydata_ppltn/1/5/{region}")
//                        .build(seoulApiKey, region))
//                .retrieve()
//                .bodyToMono(JsonNode.class); // 필요에 따라 DTO로 바꿔도 됨
//    }
    public Mono<JsonNode> searchRegion(String region) {
        //log.info("region : " + region);
        //log.info("seoulApiKey :" + seoulApiKey);
        //log.info(">>> 실제 API 호출 – region : {}", region);
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/{apiKey}/json/citydata_ppltn/1/5/{region}")
                        .build(seoulApiKey, region))
                .retrieve()
                .bodyToMono(JsonNode.class)
                // HTTP 5xx, 네트워크 에러 등에 재시도
                .retryWhen(RETRY_SPEC)
                // 재시도 후에도 오류면 로그 남기고 에러 전달
                .doOnError(err ->
                        log.error("▶ API 호출 실패 (region={}): {}", region, err.toString())
                );
    }

    public Mono<Map<String, JsonNode>> searchRegionsAsMap(List<String> regions) {
        return Flux.fromIterable(regions)
                // 각 region마다 Mono<String> 요청을 맵핑
                .flatMap(region ->
                        searchRegion(region)
                                // 응답값에 region 키를 함께 묶어서 Tuple2로 방출
                                .map(result -> Tuples.of(region, result))
                )
                // Tuple2(region, result)들을 Map으로 수집
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    public Mono<Map<String, RegionInfo>> getMaxCongestionByRegionWithColor() {
        return Flux.fromIterable(getAllPlaceNames())
                .flatMap(placeName ->
                                searchRegion(placeName)
                                        .map(root -> root.path("SeoulRtd.citydata_ppltn").get(0))
                                        .map(elem -> {
                                            // (A) 기본 데이터 추출
                                            String name       = elem.path("AREA_NM").asText();
                                            String level      = elem.path("AREA_CONGEST_LVL").asText();
                                            String regionCode = seoulPlaceRepository
                                                    .findByPlaceName(name)
                                                    .orElseThrow(() -> new IllegalStateException(name + " 미매핑"))
                                                    .getRegionCode();
                                            // (B) 색상 결정
                                            String color      = decideColor(level);
                                            // (C) DTO 생성
                                            return Tuples.of(regionCode, new RegionInfo(name, level, color));
                                        })
                        , 30)
                // (D) 같은 구별로 가장 priority가 높은 DTO 하나만 남기기
                .groupBy(Tuple2::getT1, Tuple2::getT2)
                .flatMap(gf ->
                        gf.reduce((r1, r2) ->
                                        priority(r1.getLevel()) >= priority(r2.getLevel()) ? r1 : r2
                                )
                                .map(maxInfo -> Tuples.of(gf.key(), maxInfo))
                )
                // (E) Map<regionCode, RegionInfo>로 수집
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    public Mono<Map<String, RegionInfo>> getMaxCongestionByRegionWithColor(Map<String, List<JsonNode>> rawDataMap) {
        Map<String, RegionInfo> maxInfoMap = rawDataMap.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(elem -> {
                                    String name  = elem.path("AREA_NM").asText();
                                    String lvl   = elem.path("AREA_CONGEST_LVL").asText();
                                    String color = decideColor(lvl);
                                    return new RegionInfo(name, lvl, color);
                                })
                                .max(Comparator.comparingInt(info -> priority(info.getLevel())))
                                .orElseThrow(() -> new IllegalStateException("빈 리스트라 처리 불가"))
                ));
        return Mono.just(maxInfoMap);
    }


    public Mono<Map<String, List<JsonNode>>> getAllRawDataByRegion() {
        //log.info("getAllRawDataByRegion 호출");
        return Flux.fromIterable(getAllPlaceNames())
                // (1) placeName마다 API 호출 → Mono<JsonNode root>
                .flatMap(placeName ->
                                searchRegion(placeName)
                                        // (2) root에서 citydata_ppltn 배열의 첫 번째 요소(JsonNode)만 꺼낸다.
                                        .map(root -> root.path("SeoulRtd.citydata_ppltn").get(0))
                                        // (3) 각 장소 JsonNode에서 regionCode를 조회하고 Tuple로 묶는다.
                                        .map(elem -> {
                                            String name = elem.path("AREA_NM").asText();
                                            String regionCode = seoulPlaceRepository
                                                    .findByPlaceName(name)
                                                    .orElseThrow(() -> new IllegalStateException(name + " 미매핑"))
                                                    .getRegionCode();
                                            // 반환할 때는 Tuple2<regionCode, JsonNode(elem)> 형태로
                                            return Tuples.of(regionCode, elem);
                                        })
                        , 30)  // 동시성 30으로 병렬 요청
                // (4) regionCode별로 그룹화: Tuple2.getT1()=regionCode, Tuple2.getT2()=JsonNode(elem)
                .groupBy(Tuple2::getT1, Tuple2::getT2)
                .flatMap(groupedFlux ->
                        // groupedFlux.key()가 regionCode
                        // groupedFlux.collectList()는 List<JsonNode> (각 장소의 원본 elem)
                        groupedFlux.collectList()
                                .map(list -> Tuples.of(groupedFlux.key(), list))
                )
                // (5) 최종적으로 Map<regionCode, List<JsonNode>>로 수집해서 Mono로 반환
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }
}
