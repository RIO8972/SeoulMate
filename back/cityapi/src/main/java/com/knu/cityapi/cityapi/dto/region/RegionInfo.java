package com.knu.cityapi.cityapi.dto.region;


import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class RegionInfo {
    private  String placeName;
    private  String level;
    private  String color;
    //private JsonNode raw;

    // getters...
    public RegionInfo(String placeName, String level, String color) {
        this.placeName = placeName;
        this.level     = level;
        this.color     = color;
    }
}