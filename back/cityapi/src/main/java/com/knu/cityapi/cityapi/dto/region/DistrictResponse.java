package com.knu.cityapi.cityapi.dto.region;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

import java.util.List;

@Getter @Setter @ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DistrictResponse {
    private String regionName; //한글명
    private String regionCode; //영문
    private List<JsonNode> places; //해당 지역 장소들
}
