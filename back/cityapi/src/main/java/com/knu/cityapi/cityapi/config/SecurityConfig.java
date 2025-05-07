package com.knu.cityapi.cityapi.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;


import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
// @EnableWebSecurity은 생략해도 됩니다.
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1) CSRF 비활성화 (람다 DSL)
                .csrf(csrf -> csrf.disable())
                // 2) 세션 없이 Stateless
                .sessionManagement(sm -> sm
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 3) URL 권한 설정
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/regions/population").permitAll()
                        .anyRequest().authenticated())
                // 4) 폼 로그인/Basic Auth 비활성화 (람다로 disable 호출)
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                // 5) 인증 실패 시 401 반환
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
        ;

        return http.build();
    }
}
