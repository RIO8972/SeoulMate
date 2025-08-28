package com.knu.cityapi.cityapi.service.kakao;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;


@Service
@RequiredArgsConstructor
public class KakaoSearchService {
    private final WebClient webClient = WebClient.builder().baseUrl("https://dapi.kakao.com").build();
    private final WebClient webClient2 = WebClient.builder().baseUrl("https://apis-navi.kakaomobility.com").build();
    // 페이지당 결과 수, 최대 페이징 횟수
    private static final int SIZE = 15;
    private static final int PAGES_PER_RECT = 3;
    private String authHeader() {
        return kakaoApiKey == null ? "" : kakaoApiKey.trim();
    }
    @Value("${kakao.api.key}")
    private String kakaoApiKey;

    public Mono<String> searchKeyword(String query, int size, int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/keyword.json")
                        .queryParam("query", query)
                        .queryParam("size", size)
                        .queryParam("page", page)
                        .build())
                .header("Authorization", kakaoApiKey)
                .retrieve()
                .bodyToMono(String.class); // 필요에 따라 DTO로 바꿔도 됨
    }
    public Mono<JsonNode> searchRouteCar(String start_xy, String end_xy) {
        return webClient2.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/directions")
                        .queryParam("origin",   start_xy)
                        .queryParam("destination", end_xy)
                        .queryParam("priority", "TIME")
                        .build())
                .header("Authorization", kakaoApiKey)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }
    // KakaoSearchService.java 안

    public Mono<List<JsonNode>> searchPlace(String query, List<String> rectList) {
        final String q = query == null ? "" : query.trim();

        return Flux.fromIterable(rectList)
                .flatMap(rect -> searchByRect(q, rect), 4)   // 사각형 병렬 처리(동시 4개)
                .distinct(doc -> doc.path("id").asText())    // place id 기준 중복 제거
                .collectList();
    }

    public Flux<JsonNode> searchByRect(String query, String rect) {
        return Flux.range(1, PAGES_PER_RECT)
                .concatMap(page ->
                        webClient.get()
                                .uri(uriBuilder -> uriBuilder
                                        .path("/v2/local/search/keyword.json")
                                        .queryParam("query", query)
                                        .queryParam("rect", rect)
                                        .queryParam("size", SIZE)
                                        .queryParam("page", page)
                                        .build()
                                )
                                .header("Authorization", authHeader())
                                .retrieve()
                                .bodyToMono(JsonNode.class)
                )
                // meta.is_end 가 true인 응답까지 받고 종료
                .takeUntil(res -> res.path("meta").path("is_end").asBoolean(false))
                // documents 배열만 펼치기
                .flatMap(res -> Flux.fromIterable(res.withArray("documents")));
    }

}
