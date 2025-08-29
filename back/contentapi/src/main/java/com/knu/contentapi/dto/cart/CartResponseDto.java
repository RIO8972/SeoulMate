package com.knu.contentapi.dto.cart;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponseDto {
    private long id;
    private String placeId;
    private String name;
    private String lat;
    private String lng;
    private String address;
    private String url;
}
