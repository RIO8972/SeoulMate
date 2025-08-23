package com.knu.cityapi.cityapi.service.seoul;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.dto.region.DistrictResponse;
import org.springframework.cache.Cache.ValueWrapper;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DistrictCacheAccessor {
    private final CacheManager cacheManager;

    public DistrictCacheAccessor(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public String getRegionName(String regionCode ) {
        if (regionCode == null) return "";
        switch (regionCode) {
            case "Gangnam-gu":       return "강남구";
            case "Gangdong-gu":      return "강동구";
            case "Gangseo-gu":       return "강서구";
            case "Gwanak-gu":        return "관악구";
            case "Gwangjin-gu":      return "광진구";
            case "Guro-gu":          return "구로구";
            case "Geumcheon-gu":     return "금천구";
            case "Nowon-gu":         return "노원구";
            case "Dobong-gu":        return "도봉구";
            case "Dongdaemun-gu":    return "동대문구";
            case "Dongjak-gu":       return "동작구";
            case "Mapo-gu":          return "마포구";
            case "Seodaemun-gu":     return "서대문구";
            case "Seocho-gu":        return "서초구";
            case "Seongdong-gu":     return "성동구";
            case "Seongbuk-gu":      return "성북구";
            case "Songpa-gu":        return "송파구";
            case "Yangcheon-gu":     return "양천구";
            case "Yeongdeungpo-gu":  return "영등포구";
            case "Yongsan-gu":       return "용산구";
            case "Eunpyeong-gu":     return "은평구";
            case "Jongno-gu":        return "종로구";
            case "Jung-gu":          return "중구";
            default:                 return "";
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, List<JsonNode>> getCachedDistrictAllData() {
        CaffeineCache districtCache = (CaffeineCache) cacheManager.getCache("districtCache");
        if (districtCache == null) return Collections.emptyMap();

        ValueWrapper wrapper = districtCache.get(SimpleKey.EMPTY);
        if (wrapper == null) return Collections.emptyMap();

        Object value = wrapper.get();
        if (!(value instanceof Map)) return Collections.emptyMap();

        return (Map<String, List<JsonNode>>) value;
    }

    @SuppressWarnings("unchecked")
    public List<JsonNode> getCachedDistrictPlaces(String regionCode) {
        CaffeineCache districtCache = (CaffeineCache) cacheManager.getCache("districtCache");
        if (districtCache == null) return Collections.emptyList();

        ValueWrapper wrapper = districtCache.get(SimpleKey.EMPTY);
        if (wrapper == null) return Collections.emptyList();

        Object raw = wrapper.get();
        if (!(raw instanceof Map)) return Collections.emptyList();

        Map<String, List<JsonNode>> fullMap = (Map<String, List<JsonNode>>) raw;
        return fullMap.getOrDefault(regionCode, Collections.emptyList());
    }

    public DistrictResponse getCachedDistrictResponse(String regionCode) {
        Map<String, List<JsonNode>> fullMap = getCachedDistrictAllData();
        String regionName = getRegionName(regionCode);
        List<JsonNode> list = fullMap.getOrDefault(regionCode, Collections.emptyList());

        return DistrictResponse.builder()
                .regionName(regionName)
                .regionCode(regionCode)
                .places(list)
                .build();
    }

    /**
     * 선택지 2) 핵심: Optional로 감싸서 null 직접 반환하지 않음.
     * 또한 JsonNode.get(...) 대신 path(...) 사용으로 NPE 방지.
     */
    @SuppressWarnings("unchecked")
    public Optional<JsonNode> getCityData(String regionCode) {
        CaffeineCache cityCache = (CaffeineCache) cacheManager.getCache("cityCache");
        if (cityCache == null) return Optional.empty();

        ValueWrapper wrapper = cityCache.get(SimpleKey.EMPTY);
        if (wrapper == null) return Optional.empty();

        Object raw = wrapper.get();
        if (!(raw instanceof List<?>)) return Optional.empty();

        List<JsonNode> allCities = (List<JsonNode>) raw;

        for (JsonNode city : allCities) {
            if (city == null) continue;
            String code = city.path("AREA_CD").asText(null); // 안전 접근
            if (code != null && code.equals(regionCode)) {
                return Optional.of(city);
            }
        }
        return Optional.empty();
    }
}
