package com.knu.cityapi.cityapi.service.kakao;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import org.springframework.beans.factory.annotation.Value;


@Service
@RequiredArgsConstructor
public class KakaoSearchService {
    private final WebClient webClient = WebClient.builder().baseUrl("https://dapi.kakao.com").build();
    private final WebClient webClient2 = WebClient.builder().baseUrl("https://apis-navi.kakaomobility.com").build();

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

}
