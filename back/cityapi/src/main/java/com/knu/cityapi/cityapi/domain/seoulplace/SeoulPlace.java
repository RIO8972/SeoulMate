package com.knu.cityapi.cityapi.domain.seoulplace;

import jakarta.persistence.*;
import lombok.*;

@Getter @ToString
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Table(name = "seoul_place")
public class SeoulPlace {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "place_name")
    private String placeName;

    @Column(name = "region_code")
    private String regionCode;
}
