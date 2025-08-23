package com.knu.cityapi.cityapi.service.seoul;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlaceRepository;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlace;
import com.knu.cityapi.cityapi.dto.region.RegionInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
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
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeoulRegionService {

    private final SeoulPlaceRepository seoulPlaceRepository;

    // WebClient: JSON 우선 요청 + 메모리 한도
    private final WebClient webClient = WebClient.builder()
            .baseUrl("http://openapi.seoul.go.kr:8088/")
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .exchangeStrategies(ExchangeStrategies.builder()
                    .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                    .build())
            .build();

    // retry: 최대 3회, 2초 backoff. (IllegalArgumentException만 제외하고 대부분 재시도)
    private final RetryBackoffSpec RETRY_SPEC = Retry.backoff(3, Duration.ofSeconds(2))
            .filter(ex ->
                    !(ex instanceof IllegalArgumentException)
                            // 네트워크/응답 오류/비-JSON 처리용 사용자 에러 등은 재시도
                            && (ex instanceof WebClientRequestException
                            || ex instanceof WebClientResponseException
                            || ex instanceof IllegalStateException
                            || true) // 필요시 더 좁혀도 됨
            )
            .doBeforeRetry(sig ->
                    log.warn("[Retry] citydata_ppltn 시도 #{}: {}",
                            sig.totalRetriesInARow() + 1,
                            sig.failure() == null ? "unknown" : sig.failure().toString()))
            .onRetryExhaustedThrow((spec, sig) -> {
                log.error("[RetryExhausted] 총 {}회 재시도 후 실패: {}",
                        sig.totalRetries(), sig.failure() == null ? "unknown" : sig.failure().toString());
                return sig.failure();
            });

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
        switch (lvl) {
            case "붐빔":      return "#4C75A3";
            case "약간 붐빔": return "#6C97BF";
            case "보통":      return "#89ADD3";
            case "여유":      return "#C3E1F3";
            default:          return "#C3E1F3";
        }
    }
    private int priority(String lvl) {
        switch (lvl) {
            case "붐빔":      return 4;
            case "약간 붐빔": return 3;
            case "보통":      return 2;
            case "여유":      return 1;
            default:          return 0;
        }
    }

    /** 비-JSON 응답(XML/HTML 등)일 때 재시도를 트리거하기 위해 에러로 전환하는 searchRegion */
    public Mono<JsonNode> searchRegion(String region) {
        log.info(">>> (ppltn) 실제 API 호출 – region: {}", region);
        return webClient.get()
                .uri(b -> b.path("/{apiKey}/json/citydata_ppltn/1/5/{region}")
                        .build(seoulApiKey, region))
                .exchangeToMono(resp -> {
                    MediaType ct = resp.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);
                    log.info("[ppltn] Response Content-Type for [{}]: {}", region, ct);
                    if (MediaType.APPLICATION_JSON.isCompatibleWith(ct)) {
                        return resp.bodyToMono(JsonNode.class);
                    } else {
                        return resp.bodyToMono(String.class)
                                .flatMap(body -> {
                                    log.warn("[ppltn] Non-JSON 응답 – region:{} body:{}", region, body);
                                    return Mono.error(new IllegalStateException("Non-JSON response"));
                                });
                    }
                })
                .retryWhen(RETRY_SPEC)
                .onErrorResume(e -> {
                    log.error("[ppltn] 재시도 모두 실패 – region:{} 이유: {}", region, e.toString());
                    // 빈 객체로 폴백해서 downstream이 끊기지 않도록
                    return Mono.just(JsonNodeFactory.instance.objectNode());
                });
    }

    /** 배열의 첫 요소 안전 추출: 비어있으면 empty */
    private Mono<JsonNode> firstPpltnElem(JsonNode root, String placeName) {
        JsonNode arr = root.path("SeoulRtd.citydata_ppltn");
        if (!arr.isArray() || arr.size() == 0) {
            log.warn("[ppltn] citydata_ppltn 비어있음 – place:'{}'", placeName);
            return Mono.empty(); // 스킵
        }
        return Mono.just(arr.get(0));
    }

    /** 다수 지역 조회 → Map<placeName, JsonNode(첫 elem)> */
    public Mono<Map<String, JsonNode>> searchRegionsAsMap(List<String> regions) {
        return Flux.fromIterable(regions)
                .flatMap(place ->
                                searchRegion(place)
                                        .flatMap(root -> firstPpltnElem(root, place))
                                        .map(elem -> Tuples.of(place, elem)),
                        40)
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    /** 색상 맵 구성: 매핑 실패는 스킵 (unknown 제외) */
    public Mono<Map<String, String>> setRegionColor(List<String> regions) {
        return Flux.fromIterable(regions)
                .flatMap(place ->
                                searchRegion(place)
                                        .flatMap(root -> firstPpltnElem(root, place))
                                        .map(elem -> {
                                            String placeName = elem.path("AREA_NM").asText("");
                                            String regionCode = seoulPlaceRepository.findByPlaceName(placeName)
                                                    .map(SeoulPlace::getRegionCode)
                                                    .orElse("unknown");
                                            String color = decideColor(elem.path("AREA_CONGEST_LVL").asText(""));
                                            return Tuples.of(regionCode, color);
                                        }),
                        60)
                .filter(t -> !"unknown".equals(t.getT1()))
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    /** 같은 구 내 여러 장소 → 가장 혼잡 우선순위 높은 것만 남기기 */
    public Mono<Map<String, RegionInfo>> getMaxCongestionByRegionWithColor() {
        return Flux.fromIterable(getAllPlaceNames())
                .flatMap(place ->
                                searchRegion(place)
                                        .flatMap(root -> firstPpltnElem(root, place))
                                        .map(elem -> {
                                            String name  = elem.path("AREA_NM").asText("");
                                            String lvl   = elem.path("AREA_CONGEST_LVL").asText("");
                                            String code  = seoulPlaceRepository.findByPlaceName(name)
                                                    .map(SeoulPlace::getRegionCode)
                                                    .orElse(null); // 매핑 실패 시 스킵
                                            return (code == null) ? null : Tuples.of(code, new RegionInfo(name, lvl, decideColor(lvl)));
                                        }),
                        30)
                .filter(Objects::nonNull)
                .groupBy(Tuple2::getT1, Tuple2::getT2)
                .flatMap(g ->
                        g.reduce((r1, r2) -> priority(r1.getLevel()) >= priority(r2.getLevel()) ? r1 : r2)
                                .map(max -> Tuples.of(g.key(), max)))
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    /** 원본 elem들을 지역코드별로 모아 Map<String, List<JsonNode>> */
    public Mono<Map<String, List<JsonNode>>> getAllRawDataByRegion() {
        log.info("[ppltn] getAllRawDataByRegion 호출");
        return Flux.fromIterable(getAllPlaceNames())
                .flatMap(place ->
                                searchRegion(place)
                                        .flatMap(root -> firstPpltnElem(root, place))
                                        .map(elem -> {
                                            String name = elem.path("AREA_NM").asText("");
                                            String regionCode = seoulPlaceRepository.findByPlaceName(name)
                                                    .map(SeoulPlace::getRegionCode)
                                                    .orElse(null); // 매칭 실패는 스킵
                                            return (regionCode == null) ? null : Tuples.of(regionCode, elem);
                                        }),
                        30)
                .filter(Objects::nonNull)
                .groupBy(Tuple2::getT1, Tuple2::getT2)
                .flatMap(g -> g.collectList().map(list -> Tuples.of(g.key(), list)))
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    /** 외부에서 주입된 rawDataMap으로 최대 혼잡 DTO 생성 */
    public Mono<Map<String, RegionInfo>> getMaxCongestionByRegionWithColor(Map<String, List<JsonNode>> rawDataMap) {
        Map<String, RegionInfo> maxInfoMap = rawDataMap.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream()
                                .map(elem -> {
                                    String name  = elem.path("AREA_NM").asText("");
                                    String lvl   = elem.path("AREA_CONGEST_LVL").asText("");
                                    return new RegionInfo(name, lvl, decideColor(lvl));
                                })
                                .max(Comparator.comparingInt(o -> priority(o.getLevel())))
                                .orElse(new RegionInfo("N/A", "N/A", decideColor("N/A")))
                ));
        return Mono.just(maxInfoMap);
    }
}
