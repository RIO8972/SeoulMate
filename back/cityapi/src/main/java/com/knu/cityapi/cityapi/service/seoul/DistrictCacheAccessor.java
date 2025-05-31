package com.knu.cityapi.cityapi.service.seoul;

import com.fasterxml.jackson.databind.JsonNode;
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
    public List<JsonNode> getCachedDistrictData(String regionCode) {
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
}

