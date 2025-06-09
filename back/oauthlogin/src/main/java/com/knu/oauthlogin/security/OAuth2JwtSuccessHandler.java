package com.knu.oauthlogin.security;

import com.knu.oauthlogin.service.token.JwtService;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import com.knu.oauthlogin.domain.refreshtoken.RefreshToken;
import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;

import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;




import jakarta.servlet.http.Cookie;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@RequiredArgsConstructor
@Component
public class OAuth2JwtSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
                                        HttpServletResponse res,
                                        Authentication auth) throws IOException {
        OAuth2User oauthUser = (OAuth2User) auth.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        // (1) DB에서 userId(또는 username) 조회
        User user = userRepository.findByEmail(email).orElse(null);
        String userIdStr = user.getId().toString();

        // (2) Access Token 생성
        String accessToken = jwtService.generateAccessToken(
                userIdStr,
                name,
                email
        );

        // (3) Refresh Token 생성 + DB 저장
        RefreshToken savedRt = refreshTokenService.createRefreshToken(userIdStr);
        String refreshToken = savedRt.getToken();

        // (4) Refresh Token을 HttpOnly 쿠키로 세팅
        // 쿠키 옵션: HttpOnly, Secure(HTTPS), Path 제한, SameSite=Strict 등
        Cookie rtCookie = new Cookie("refreshToken", refreshToken);
        rtCookie.setHttpOnly(true);
        rtCookie.setSecure(true); //Secure 옵션 때문에 HTTP 연결에서는 쿠키가 무시 => false로 임시 변경
        rtCookie.setPath("/");                 // /auth/refresh 요청에만 자동 전송
        rtCookie.setMaxAge((int) ( (savedRt.getExpiryDate().toEpochMilli() - System.currentTimeMillis()) / 1000 ));
        // SameSite 설정이 필요하면, 별도 헤더 조작이 필요. (서블릿 표준 쿠키엔 없으므로 응답 헤더에 수동 추가)
        // 예: res.addHeader("Set-Cookie", "refreshToken=" + refreshToken + "; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=...");

        res.addCookie(rtCookie);

        //(5) Access Token을 JSON 바디로 반환 (원한다면 Header에도 추가 가능)
//        res.setHeader(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
//        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
//        Map<String, String> body = Map.of("accessToken", accessToken);
//        objectMapper.writeValue(res.getWriter(), body);

        String redirectTo = UriComponentsBuilder
                .fromUriString("http://localhost:3000/savetoken")
                .queryParam("accessToken", accessToken)
                .build().toUriString();
        res.sendRedirect(redirectTo);
    }
}



