package com.knu.cityapi.cityapi.service.seoul;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlaceRepository;
import com.knu.cityapi.cityapi.domain.seoulplace.SeoulPlace;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
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
    private  final WebClient webClient = WebClient.builder()
            .exchangeStrategies(ExchangeStrategies.builder()
                    .codecs(configurer ->
                            configurer.defaultCodecs()
                                    .maxInMemorySize(10 * 1024 * 1024)  // 10MB
                    )
                    .build()
            )
            .baseUrl("http://openapi.seoul.go.kr:8088/")
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
//    public Mono<JsonNode> searchRegion(String region) {
//        log.info("city_region : " + region);
//        log.info("seoulApiKey :" + seoulApiKey);
//        log.info(">>> 실제 API 호출 – region : {}", region);
//        /*
//           이런식으로
//           Webclient의 라이브러리를 사용하려면 WebClient 객체를 통해
//           체인메서드를 구성해서 http요청/응답을 받아서 Mono<>컨테이너로 반환
//         */
//        return webClient.get()
//                .uri(uriBuilder -> uriBuilder
//                        .path("/{apiKey}/json/citydata/1/5/{region}")
//                        .build(seoulApiKey, region))
//                .retrieve()
//                .bodyToMono(JsonNode.class); // 필요에 따라 DTO로 바꿔도 됨
//        //Dto로 보내면 fetch에서 리턴받을 때 바로 json으로 받을 수 있음
//    }
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
                        // JSON이 아니면 의도적으로 에러로 만들어 재시도 트리거
                        return response.bodyToMono(String.class)
                                .flatMap(body -> {
                                    log.warn("Non-JSON 응답 – region:{} body:{}", region, body);
                                    return Mono.error(new IllegalStateException("Non-JSON response"));
                                });
                    }
                })
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(1))
                        .filter(ex -> ex instanceof IllegalStateException))
                // 3회 재시도까지 모두 실패하면, 빈 객체로 폴백
                .onErrorResume(e -> {
                    log.error("재시도 모두 실패 – region:{}, 이유: {}", region, e.getMessage());
                    return Mono.just(JsonNodeFactory.instance.objectNode());
                });
    }

    public Mono<Map<String, JsonNode>> getAllRawDataByRegion() {
        return Flux.fromIterable(getAllPlaceNames())
                .flatMap(placeName ->
                                searchRegion(placeName)
                                        // CITYDATA 전체 노드
                                        .map(root -> root.path("CITYDATA"))
                                        // regionCode 매핑
                                        .map(cityData -> {
                                            String name = cityData.path("AREA_NM").asText();
                                            String regionCode = seoulPlaceRepository
                                                    .findByPlaceName(name)
                                                    .orElseThrow()
                                                    .getRegionCode();
                                            return Tuples.of(regionCode, cityData);
                                        })
                        , 30)
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }
    public Mono<List<JsonNode>> getAllDataByRegion() {
        return Flux.fromIterable(getAllPlaceNames())
                .flatMap(placeName ->
                                searchRegion(placeName)
                                        .map(root -> root.path("CITYDATA"))
                        , 30)
                .collectList();
    }

    // public Mono<Map>
}
