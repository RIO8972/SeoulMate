package com.knu.cityapi.cityapi.service.odsay;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;

@Service
@Slf4j
public class RouteDurationService {
    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.odsay.com")       // <-- 도메인까지만
            .build();
    @Value("${odsay.api.key}")
    private String odsayApiKey;
    public Mono<JsonNode> searchRoutePublicTransport(String start_x, String start_y, String end_x, String end_y) {
        log.info("요청 키 = {}", odsayApiKey);

        return webClient.get()
                .uri(uriBuilder -> {
                    URI uri = uriBuilder
                            .path("/v1/api/searchPubTransPathT")
                            .queryParam("SX",  start_x)
                            .queryParam("SY", start_y)
                            .queryParam("EX", end_x)
                            .queryParam("EY", end_y)
                            .queryParam("apiKey", odsayApiKey)
                            .build();
                    // 2) 여기서 URI 문자열을 로그로 찍는다
                    log.info("▶▶ ODsay 실제 호출 URI = {}", uri.toString());

                    // 3) 만든 URI를 반환
                    return uri;
                })
                .retrieve()
                .bodyToMono(JsonNode.class);
    }
}
