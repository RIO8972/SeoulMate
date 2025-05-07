package com.knu.cityapi.cityapi.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1) CSRF 끄기: API 에는 토큰으로 인증하므로 CSRF 토큰 불필요
                .csrf().disable()
                // 2) 세션도 만들지 않고 요청당 토큰 검사
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                // 3) 엔드포인트별 접근 권한
                .authorizeHttpRequests()
                // 로그인 처리 URL, 공개 API는 모두 허용
                .requestMatchers("/login", "/regions/population").permitAll()
                // 그 외는 토큰 인증 필요
                .anyRequest().authenticated()
                .and()
                // 4) 폼 로그인 꺼버리기
                .formLogin().disable()
                .httpBasic().disable()
                // 5) 인증 실패 시 302 대신 401 반환
                .exceptionHandling()
                .authenticationEntryPoint((req, res, ex) ->
                        res.sendError(HttpServletResponse.SC_UNAUTHORIZED));

        // JWT 필터가 있다면 여기서 등록…
        // http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
