package com.knu.cityapi.cityapi.service.seoul;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlaceRepository;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlace;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeoulCityDataService {

    private final SeoulPlaceRepository seoulPlaceRepository;

    // WebClient: JSON 우선, 메모리 제한 확대
    private final WebClient webClient = WebClient.builder()
            .exchangeStrategies(ExchangeStrategies.builder()
                    .codecs(configurer ->
                            configurer.defaultCodecs()
                                    .maxInMemorySize(10 * 1024 * 1024)  // 10MB
                    )
                    .build()
            )
            .baseUrl("http://openapi.seoul.go.kr:8088/")
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .build();

    @Cacheable("allPlaces")
    public List<String> getAllPlaceNames() {
        return seoulPlaceRepository.findAll()
                .stream()
                .map(SeoulPlace::getPlaceName)
                .collect(Collectors.toList());
    }

    @Value("${seoul.api.key}")
    private String seoulApiKey;

    public Mono<JsonNode> searchRegion(String region) {
        log.info(">>> 실제 API 호출 – region: {}", region);

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/{apiKey}/json/citydata/1/5/{region}")
                        .build(seoulApiKey, region))
                .exchangeToMono(response -> {
                    MediaType ct = response.headers()
                            .contentType()
                            .orElse(MediaType.APPLICATION_OCTET_STREAM);
                    log.info("Response Content-Type for [{}]: {}", region, ct);

                    if (MediaType.APPLICATION_JSON.isCompatibleWith(ct)) {
                        return response.bodyToMono(JsonNode.class);
                    } else {
                        // JSON이 아니면 재시도 트리거를 위해 에러로 전환
                        return response.bodyToMono(String.class)
                                .flatMap(body -> {
                                    log.warn("Non-JSON 응답 – region:{} body:{}", region, body);
                                    return Mono.error(new IllegalStateException("Non-JSON response"));
                                });
                    }
                })
                // 비-JSON(IllegalStateException)에 대해 3회 재시도 (필요 시 필터 범위를 넓히세요)
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(1))
                        .filter(ex -> ex instanceof IllegalStateException))
                // 재시도 모두 실패 → 빈 객체로 폴백
                .onErrorResume(e -> {
                    log.error("재시도 모두 실패 – region:{}, 이유: {}", region, e.getMessage());
                    return Mono.just(JsonNodeFactory.instance.objectNode());
                });
    }

    /**
     * 지역 코드 → CITYDATA 매핑 맵. (DB placeName 매칭 실패 시 스킵)
     */
    public Mono<Map<String, JsonNode>> getAllRawDataByRegion() {
        return Flux.fromIterable(getAllPlaceNames())
                .flatMap(placeName ->
                                searchRegion(placeName)
                                        .map(root -> root.path("CITYDATA"))
                                        .map(cityData -> {
                                            String name = cityData.path("AREA_NM").asText("").trim();
                                            String regionCode = seoulPlaceRepository
                                                    .findByPlaceName(name)
                                                    .map(SeoulPlace::getRegionCode)
                                                    .orElse(null); // 매칭 실패 시 null
                                            return Tuples.of(regionCode, cityData);
                                        }),
                        30)
                .filter(t -> t.getT1() != null) // 매칭 실패 건은 스킵
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    /**
     * CITYDATA 리스트(캐시 적재용). 필수 키(AREA_CD) 없는 항목은 걸러낸다.
     */
    public Mono<List<JsonNode>> getAllDataByRegion() {
        return Flux.fromIterable(getAllPlaceNames())
                .flatMap(placeName ->
                                searchRegion(placeName)
                                        .map(root -> root.path("CITYDATA")),
                        30)
                // 불량 항목 필터링(AREA_CD 없는 것 제거)
                .filter(node -> node != null && node.path("AREA_CD").isTextual())
                .collectList();
    }
}