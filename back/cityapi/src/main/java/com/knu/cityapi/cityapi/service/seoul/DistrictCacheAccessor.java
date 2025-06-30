package com.knu.cityapi.cityapi.service.seoul;

import com.fasterxml.jackson.databind.JsonNode;
import com.knu.cityapi.cityapi.dto.region.DistrictResponse;
import org.springframework.cache.Cache.ValueWrapper;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DistrictCacheAccessor {
    private final CacheManager cacheManager;

    public DistrictCacheAccessor(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public String getRegionName(String regionCode ) {
        if (regionCode == null) {
            return "";
        }
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

    /**
     * 1) SimpleKey.EMPTY를 키로 사용해 저장된 데이터를 꺼내는 방법
     */
    @SuppressWarnings("unchecked")
    public Map<String, List<JsonNode>> getCachedDistrictAllData() {
        // 1) CacheManager에서 "districtCache"라는 이름으로 캐시 객체를 얻는다
        CaffeineCache districtCache = (CaffeineCache) cacheManager.getCache("districtCache");
        if (districtCache == null) {
            // 캐시가 등록되지 않았거나 잘못된 이름으로 조회했을 때
            return null;
        }

        // 2) 파라미터가 없는 @Cacheable 호출의 기본 키는 SimpleKey.EMPTY 이므로, 이 키로 가져온다
        ValueWrapper wrapper = districtCache.get(SimpleKey.EMPTY);
        if (wrapper == null) {
            // 아직 캐시에 값이 채워지지 않은 상태
            return null;
        }

        // 3) ValueWrapper.get()으로 실제 Map<String, List<JsonNode>> 객체를 꺼낸다
        Object value = wrapper.get();
        return (Map<String, List<JsonNode>>) value;
    }


    @SuppressWarnings("unchecked")
    public List<JsonNode> getCachedDistrictPlaces(String regionCode) {
        // 1) CacheManager에서 "districtCache"라는 이름으로 캐시 객체를 얻는다
        CaffeineCache districtCache = (CaffeineCache) cacheManager.getCache("districtCache");
        if (districtCache == null) {
            // 캐시가 등록되지 않았거나 잘못된 이름으로 조회했을 때
            return null;
        }

        // 2) 파라미터가 없는 @Cacheable 호출의 기본 키는 SimpleKey.EMPTY 이므로, 이 키로 가져온다
        ValueWrapper wrapper = districtCache.get(SimpleKey.EMPTY);
        if (wrapper == null) {
            // 아직 캐시에 값이 채워지지 않은 상태
            return null;
        }

        // 3) ValueWrapper.get()으로 전체 Map<String, List<JsonNode>>를 꺼낸다
        Object raw = wrapper.get();
        if (!(raw instanceof Map)) {
            // 캐시된 값이 Map이 아닌 경우 방어 코드
            return null;
        }
        Map<String, List<JsonNode>> fullMap = (Map<String, List<JsonNode>>) raw;

        // 4) 원하는 regionCode에 해당하는 List<JsonNode>만 꺼내서 반환
        //    (해당 key가 없으면 빈 리스트 혹은 null을 반환할 수도 있음)
        return fullMap.getOrDefault(regionCode, List.of());
    }

    public DistrictResponse getCachedDistrictResponse(String regionCode) {
        // 1) CacheManager에서 "districtCache"라는 이름으로 캐시 객체를 얻는다
        CaffeineCache districtCache = (CaffeineCache) cacheManager.getCache("districtCache");
        String regionName = getRegionName(regionCode);

        if (districtCache == null) {
            // 캐시가 등록되지 않았거나 잘못된 이름으로 조회했을 때
            return null;
        }

        // 2) 파라미터가 없는 @Cacheable 호출의 기본 키는 SimpleKey.EMPTY 이므로, 이 키로 가져온다
        ValueWrapper wrapper = districtCache.get(SimpleKey.EMPTY);
        if (wrapper == null) {
            // 아직 캐시에 값이 채워지지 않은 상태
            return null;
        }

        // 3) ValueWrapper.get()으로 전체 Map<String, List<JsonNode>>를 꺼낸다
        Object raw = wrapper.get();
        if (!(raw instanceof Map)) {
            // 캐시된 값이 Map이 아닌 경우 방어 코드
            return null;
        }
        Map<String, List<JsonNode>> fullMap = (Map<String, List<JsonNode>>) raw;

        // 4) 원하는 regionCode에 해당하는 List<JsonNode>만 꺼내서 반환
        //    해당 key가 없으면 빈 리스트 혹은 null
        List<JsonNode>list = fullMap.getOrDefault(regionCode, List.of());

        DistrictResponse districtResponse = DistrictResponse.builder()
                .regionName(regionName)
                .regionCode(regionCode)
                .places(list)
                .build();
        return districtResponse;
    }

    public JsonNode getCityData(String regionCode) {
        CaffeineCache cityCache = (CaffeineCache) cacheManager.getCache("cityCache");
        if ( cityCache == null) { return null; }

        ValueWrapper wrapper = cityCache.get(SimpleKey.EMPTY);
        if (wrapper == null) { return null; }

        // 2) 캐시에 들어 있는 값을 꺼내서 List<JsonNode> 로 캐스팅
        Object raw = wrapper.get();
        if (!(raw instanceof List<?>)) {
            return null;
        }
        @SuppressWarnings("unchecked")
        List<JsonNode> allCities = (List<JsonNode>) raw;

        for(JsonNode city : allCities) {
            if(regionCode.equals(city.get("AREA_CD").asText()))
                return city;
        }
        return null;
    }
}

