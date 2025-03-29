package com.knu.oauthlogin.domain;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;


@Getter @ToString
@Entity
@Table(name="USERS") //https://lktgt.tistory.com/47 USER는 얘약어여엇 USERS사용
@NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "user_id")
    private Long id;
    @Column(name = "username", nullable = false)
    private String username; // 로그인한 사용자의 이름

    public User(String name){
        this.username = name;
    }

}
