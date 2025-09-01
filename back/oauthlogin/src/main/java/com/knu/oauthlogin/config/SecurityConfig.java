package com.knu.oauthlogin.config;

import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.security.JwtAuthenticationFilter;
import com.knu.oauthlogin.security.OAuth2JwtSuccessHandler;
import com.knu.oauthlogin.service.auth.CustomUserDetailsService;
import com.knu.oauthlogin.service.token.JwtService;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.security.KeyPair;


@Slf4j
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final CustomUserDetailsService customUserDetailsService;
    private final OAuth2UserService oAuth2UserService; // 기존 사용하던 서비스
    private final UserRepository userRepository;       // 사용자 조회용
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;      // Bean으로 주입받은 필드
    private final OAuth2JwtSuccessHandler oAuth2JwtSuccessHandler;

    /** JwtAuthenticationFilter 빈을 직접 등록 **/
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtService);
    }
    // 비밀번호 암호화용
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 로그인 API를 위한 AuthenticationManager
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // --- DaoAuthenticationProvider를 직접 만들어서 체인에 등록 ---
        DaoAuthenticationProvider daoProvider = new DaoAuthenticationProvider();
        daoProvider.setUserDetailsService(customUserDetailsService);
        daoProvider.setPasswordEncoder(passwordEncoder());

        return http
                .authenticationProvider(
                        new DaoAuthenticationProvider() {{
                            setUserDetailsService(customUserDetailsService);
                            setPasswordEncoder(passwordEncoder());
                        }})
                // 1) CSRF 비활성화 (stateless JWT 기반)
                .csrf(csrf -> csrf.disable())

                // 2) 세션을 사용하지 않음
                .sessionManagement(sm -> sm
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3) 인증·인가 URL 설정
                .authorizeHttpRequests(auth -> auth
                        // OAuth 로그인, 리프레시 엔드포인트, 홈 등은 모두 허용
                        .requestMatchers(
                                "/controller","/banner/**", //나중에 지우기
                                "/signup", "/login", //자체로그인
                                "/oauth2/**", "/oauth-login",
                                "/token/*", //refesh토큰
                                "token/logout",
                                "/auth/password/email-code",
                                "/auth/password/issue-temp"// 임시비번 API 익명 허용
                        ).permitAll()
                        .requestMatchers("/auth/password/change").authenticated() // ← 여기!
                        // H2 콘솔도 필요시 열어둘 수 있음
                        .requestMatchers("/h2-console/**").permitAll()
                        // 나머지 요청은 모두 인증 필요
                        .anyRequest().authenticated()
                )
                // 4) 인증 실패 시 기본 로그인 폼 리다이렉트가 아닌 401 리턴
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, authException) -> {
                            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                        })
                )
                // 5) 기본 폼 로그인( /login )을 완전히 비활성화
                .formLogin(form -> form.disable())
                .formLogin(form -> form
                        .loginProcessingUrl("/login")
                        .usernameParameter("email")
                        .passwordParameter("password")
                        .successHandler(oAuth2JwtSuccessHandler)   // 주입받은 빈 사용
                        .failureHandler((req, res, ex) -> { /* 실패 처리 */ })
                )

                // 6) HTTP Basic 인증도 비활성화 (필요 없다면 꺼 두세요)
                .httpBasic(basic -> basic.disable())
                // 4) H2-console 프레임 옵션 허용(같은 origin)
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin()))

                // 5) JWT 필터: UsernamePasswordAuthenticationFilter 앞에 등록
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)

                // 6) OAuth2 로그인 설정(기존 사용하던 로직 유지)
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(ui -> ui.userService(oAuth2UserService))
                        //.successHandler(new OAuth2JwtSuccessHandler(jwtService(), userRepository))
                        // ⚠ jwtService()가 아니라 주입받은 jwtService 필드를 그대로 사용
                        .successHandler(oAuth2JwtSuccessHandler)
                )

                // 7) 로그아웃 설정 (필요하다면 Refresh Token 삭제 로직 추가)
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((req, res, auth) -> {
                            // 로그아웃 시 DB에서 Refresh Token 삭제
                            if (auth != null && auth.getName() != null) {
                                // 예: refreshTokenService.deleteByUsername(auth.getName());
                            }
                            res.setStatus(HttpStatus.OK.value());
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            res.getWriter().write("{\"message\":\"로그아웃 되었습니다.\"}");
                        })
                        .invalidateHttpSession(true)
                        .deleteCookies("refreshToken")
                )
                .build();
    }
}