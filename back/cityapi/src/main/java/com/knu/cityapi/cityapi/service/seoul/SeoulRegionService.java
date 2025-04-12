package com.knu.cityapi.cityapi.service.seoul;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class SeoulRegionService {
    private  final WebClient webClient = WebClient.builder().baseUrl("http://openapi.seoul.go.kr:8088/").build();

    @Value("${seoul.api.key}")
    private String seoulApiKey;

    public Mono<String> searchRegion(String region){
        //log.info("region : "+ region);
        //log.info("seoulApiKey :"+ seoulApiKey);
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/{apiKey}/json/citydata_ppltn/1/5/{region}")
                        .build(seoulApiKey, region))
                .retrieve()
                .bodyToMono(String.class); // 필요에 따라 DTO로 바꿔도 됨
    }
}
