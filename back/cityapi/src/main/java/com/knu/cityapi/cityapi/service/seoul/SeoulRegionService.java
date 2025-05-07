package com.knu.cityapi.cityapi.service.seoul;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SeoulRegionService {
    private  final WebClient webClient = WebClient.builder().baseUrl("http://openapi.seoul.go.kr:8088/").build();

    @Value("${seoul.api.key}")
    private String seoulApiKey;

    public Mono<JsonNode> searchRegion(String region){
        //log.info("region : "+ region);
        //log.info("seoulApiKey :"+ seoulApiKey);
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/{apiKey}/json/citydata_ppltn/1/5/{region}")
                        .build(seoulApiKey, region))
                .retrieve()
                .bodyToMono(JsonNode.class); // 필요에 따라 DTO로 바꿔도 됨
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
}
