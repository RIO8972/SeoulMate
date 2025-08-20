package com.knu.contentapi.config.security;

import com.knu.contentapi.domain.users.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepo;

    public SecurityConfig(JwtTokenProvider tokenProvider, UserRepository userRepo) {
        this.tokenProvider = tokenProvider;
        this.userRepo = userRepo;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**")   // CSRF 예외
                        .disable()                                     // 전체 비활성도 OK
                )
                .cors(cors -> cors.configurationSource(request -> {
                    var c = new CorsConfiguration();
                    c.setAllowedOrigins(List.of(
                            "http://localhost:3000",
                            "https://seoul-mate.co.kr"
                    ));
                    c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
                    c.setAllowedHeaders(List.of(
                            "Authorization","Content-Type","DNT","User-Agent",
                            "If-Modified-Since","Cache-Control","X-Requested-With"
                    ));
                    c.setAllowCredentials(true);
                    return c;
                }))
                .headers(h -> h.frameOptions(f -> f.sameOrigin())) // iframe 허용
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers("/h2-console/**").permitAll() // H2 콘솔 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() //이거뭐임????
                        //.requestMatchers(HttpMethod.POST, "/reviews/**").authenticated()
                        //.requestMatchers(HttpMethod.POST, "/course/**").authenticated()
                        //.requestMatchers(HttpMethod.POST, "/cart/**").authenticated()
                        .requestMatchers("/reviews/**").authenticated()   // ← 여기서 리뷰 전부 인증 강제
                        .requestMatchers("/courses/**").authenticated()   // ← 여기서 코스 전부 인증 강제
                        .requestMatchers("/carts/**").authenticated()   // ← 여기서 찜목록 전부 인증 강제
                        .requestMatchers("/users/**").authenticated()   // ← 여기서 유저관련 전부 인증 강제
                        .anyRequest().permitAll()
                )
                .addFilterBefore(new JwtAuthenticationFilter(tokenProvider, userRepo),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
