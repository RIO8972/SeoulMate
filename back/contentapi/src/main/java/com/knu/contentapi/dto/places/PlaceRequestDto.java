package com.knu.contentapi.dto.places;

import lombok.*;

@Getter @Setter @ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class PlaceRequestDto {
    private String placeId;
    private String name;
    private String lat;
    private String lng;
    private String address;
    private String url;
}
