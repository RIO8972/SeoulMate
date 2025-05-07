package com.knu.cityapi.cityapi.config;


//@Configuration
public class SecurityConfig {
//
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//        http
//                // 1) CSRF 비활성화 (람다 DSL)
//                .csrf(csrf -> csrf.disable())
//                // 2) 세션 없이 Stateless
//                .sessionManagement(sm -> sm
//                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//                // 3) URL 권한 설정
//                .authorizeHttpRequests(auth -> auth
//                        .requestMatchers("/regions/population").permitAll()
//                        .anyRequest().authenticated())
//                // 4) 폼 로그인/Basic Auth 비활성화 (람다로 disable 호출)
//                .formLogin(form -> form.disable())
//                .httpBasic(basic -> basic.disable())
//                // 5) 인증 실패 시 401 반환
//                .exceptionHandling(ex -> ex
//                        .authenticationEntryPoint((req, res, e) ->
//                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
//        ;
//
//        return http.build();
//    }
}
