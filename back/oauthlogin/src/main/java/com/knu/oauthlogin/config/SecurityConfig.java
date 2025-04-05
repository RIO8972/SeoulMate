package com.knu.oauthlogin.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.web.SecurityFilterChain;


@Slf4j
@EnableWebSecurity//시큐리티 활성화
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final OAuth2UserService oAuth2UserService;
    @Bean 
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrfConfigurer -> csrfConfigurer.disable()) // CSRF 보호 비활성화
            .logout(logoutConfigurer -> logoutConfigurer.disable()) // 로그아웃 비활성화()
            //.formLogin(formLoginConfigurer -> formLoginConfigurer
            //    .loginPage("/oauth-login")//로그인창 view파일
            //    .permitAll()) // 폼 로그인 비활성화

            .authorizeHttpRequests(authorize -> authorize // 요청에 대한 인증 절차 AuthorizeHttpRequestsConfigurer 타입의 객체로, HTTP 요청에 대한 인증 및 인가 규칙을 추가하는 데 사용됩니다.
                    .requestMatchers("/").permitAll() // 해당 URL은 인증 절차 없이 접근 가능
                    .anyRequest().authenticated()) // 그 외의 요청은 인증 필요
            .headers(headers -> headers
                    .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
            .oauth2Login(oauth2Configurer -> oauth2Configurer
                    .userInfoEndpoint(userInfoEndpointConfig -> userInfoEndpointConfig
                            .userService(oAuth2UserService))
                    .defaultSuccessUrl("/controller",true)) //인증 후 리다이렉션 url
            .logout(logout -> logout
                    .logoutUrl("/logout") // 로그아웃 URL
                    .logoutSuccessUrl("/")
                    .invalidateHttpSession(true) // 세션 무효화
                    .deleteCookies("session_id","JSESSIONID"))
            .build();
    }
}