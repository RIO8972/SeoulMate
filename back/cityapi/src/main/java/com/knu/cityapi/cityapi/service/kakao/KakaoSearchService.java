package com.knu.cityapi.cityapi.service.kakao;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import org.springframework.beans.factory.annotation.Value;


@Service
@RequiredArgsConstructor
public class KakaoSearchService {
    private final WebClient webClient = WebClient.builder().baseUrl("https://dapi.kakao.com").build();
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

}
