package com.knu.contentapi.domain.carts;

import com.knu.contentapi.domain.users.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import jakarta.persistence.Id;


@Entity
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Slf4j
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column
    private String placeId;
    @Column
    private String name;
    @Column
    private String lat;
    @Column
    private String lng;
    @Column
    private String address;
    @Column
    private String url;
}
