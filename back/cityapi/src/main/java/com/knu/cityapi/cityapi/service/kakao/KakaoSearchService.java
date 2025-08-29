package com.knu.cityapi.cityapi.service.kakao;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;


@Service
@RequiredArgsConstructor
@Slf4j
public class KakaoSearchService {
    private final WebClient webClient = WebClient.builder().baseUrl("https://dapi.kakao.com").build();
    private final WebClient webClient2 = WebClient.builder().baseUrl("https://apis-navi.kakaomobility.com").build();
    // 페이지당 결과 수, 최대 페이징 횟수
    private static final int SIZE = 15;
    private static final int PAGES_PER_RECT = 3;
    // 전체 요청 카운터 (필드 추가만)
    private final AtomicInteger totalReqCount = new AtomicInteger();

    @Value("${kakao.api.key}")
    private String kakaoApiKey;

    // ★ RAW 바디 파싱용 (임시 진단)
    private static final com.fasterxml.jackson.databind.ObjectMapper MAPPER =
            new com.fasterxml.jackson.databind.ObjectMapper();

    // ★ 이미 "KakaoAK {키}" 형태로 yml에 넣는다고 했으니 그대로 반환
    private String authHeader() {
        return kakaoApiKey == null ? "" : kakaoApiKey.trim();
    }

    // 클래스 상단에 추가
    private static final java.util.regex.Pattern INVISIBLE_CHARS =
            java.util.regex.Pattern.compile("[\\p{Cntrl}\\u200B-\\u200D\\uFEFF]"); // 제어문자 + 제로폭

    private static String sanitizeQuery(String s) {
        if (s == null) return "";
        return INVISIBLE_CHARS.matcher(s).replaceAll("").trim();
    }

    // 디버깅용: 코드포인트 찍어보기(원인 확정 후 주석처리 가능)
    private static String codepoints(String s) {
        return s.chars().mapToObj(cp -> String.format("U+%04X", cp))
                .reduce((a,b) -> a + " " + b).orElse("");
    }

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
    // ▶ CT1(문화시설/전시장) 카테고리 주변 1건 (없으면 Mono.empty())
    public Mono<JsonNode> nearestCategoryCT1(double x, double y, int radiusMeters, int size) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/category.json")
                        .queryParam("category_group_code", "CT1")
                        .queryParam("x", x) // 경도
                        .queryParam("y", y) // 위도
                        .queryParam("radius", Math.max(1, radiusMeters))
                        .queryParam("sort", "distance")
                        .queryParam("size", Math.max(1, Math.min(size, 15))) // 카카오 제한: 최대 15
                        .build())
                .header("Authorization", authHeader())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .flatMap(json -> {
                    JsonNode docs = json.path("documents");
                    if (docs.isArray() && docs.size() > 0) {
                        JsonNode first = docs.get(0);
                        log.info("[CT1] x={}, y={} -> {}", x, y, first.path("place_name").asText(""));
                        return Mono.just(first);
                    }
                    return Mono.empty();
                });
    }

    // ▶ 키워드(관광명소) 주변 1건 (없으면 Mono.empty())
    public Mono<JsonNode> nearestKeywordAround(String query, double x, double y, int radiusMeters, int size) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/keyword.json")
                        .queryParam("query", sanitizeQuery(query)) // 앞서 선언해둔 sanitizeQuery 재사용
                        .queryParam("x", x)
                        .queryParam("y", y)
                        .queryParam("radius", Math.max(1, radiusMeters))
                        .queryParam("sort", "distance")
                        .queryParam("size", Math.max(1, Math.min(size, 15)))
                        .build())
                .header("Authorization", authHeader())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .flatMap(json -> {
                    JsonNode docs = json.path("documents");
                    if (docs.isArray() && docs.size() > 0) {
                        JsonNode first = docs.get(0);
                        log.info("[KEYWORD:{}] x={}, y={} -> {}", query, x, y, first.path("place_name").asText(""));
                        return Mono.just(first);
                    }
                    return Mono.empty();
                });
    }

// KakaoSearchService.java

    public Mono<JsonNode> findNearestPlaceWithFallback(double x, double y, int catRadius, int kwRadius) {
        return nearestCategoryCT1(x, y, Math.max(catRadius, 1), 1)
                .map(doc -> {
                    var obj = MAPPER.createObjectNode();
                    obj.put("source", "category");
                    obj.set("document", doc);
                    return (JsonNode) obj;
                })
                .switchIfEmpty(Mono.defer(() -> {
                    // 카테고리 CT1 결과가 없을 때 폴백 시도 로그
                    log.info("[NEAREST] no CT1 within {}m at x={}, y={}, trying keyword within {}m",
                            catRadius, x, y, kwRadius);
                    return nearestKeywordAround("관광명소", x, y, Math.max(kwRadius, 1), 1)
                            .map(doc -> {
                                var obj = MAPPER.createObjectNode();
                                obj.put("source", "keyword");
                                obj.set("document", doc);
                                return (JsonNode) obj;
                            });
                }))
                // 결과가 있을 때 필드 요약 로그
                .doOnNext(res -> {
                    var doc = res.path("document");
                    String name = doc.path("place_name").asText("");
                    String id   = doc.path("id").asText("");
                    String dist = doc.path("distance").asText(""); // m 단위(문자열)
                    String addr = doc.path("road_address_name").asText(
                            doc.path("address_name").asText(""));
                    String source = res.path("source").asText("");

                    log.info("[NEAREST] x={}, y={}, source={}, place_name='{}', id={}, distance={}m, address='{}'",
                            x, y, source, name, id, dist, addr);
                })
                // 카테고리도 없고 키워드도 없을 때(완전 무결과) 로그
                .switchIfEmpty(
                        Mono.fromRunnable(() ->
                                log.info("[NEAREST] no result for x={}, y={}, catRadius={}m, kwRadius={}m",
                                        x, y, catRadius, kwRadius)
                        ).then(Mono.empty())
                )
                // 예외 발생 시 로그
                .doOnError(e -> log.error("[NEAREST] error for x={}, y={}: {}", x, y, e.getMessage(), e));
    }
}
