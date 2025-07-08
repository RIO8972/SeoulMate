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

import org.springframework.security.core.userdetails.UserDetails;
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
        // 1) principal 타입에 따라 분기
        String email;
        String name;
        String userIdStr;

        Object principal = auth.getPrincipal();
        if (principal instanceof OAuth2User oauthUser) {
            // OAuth2 로그인 흐름
            email = oauthUser.getAttribute("email");
            name  = oauthUser.getAttribute("name");
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("OAuth2User not found: " + email));
            userIdStr = user.getId().toString();
        } else if (principal instanceof UserDetails ud) {
            // 폼 로그인 흐름
            email = ud.getUsername();      // UserDetailsService가 설정한 username(email)
            name  = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Local user not found: " + email))
                    .getUsername();
            User user = userRepository.findByEmailAndProvider(email, "LOCAL")
                    .orElseThrow(() -> new IllegalStateException("Local user not found: " + email));
            userIdStr = user.getId().toString();
        } else {
            throw new IllegalStateException(
                    "알 수 없는 principal 타입: " + principal.getClass().getName()
            );
        }

        // 2) Access Token 생성
        String accessToken = jwtService.generateAccessToken(
                userIdStr,
                name,
                email
        );

        // (3) Refresh Token 생성 + DB 저장
        RefreshToken savedRt = refreshTokenService.createRefreshToken(userIdStr);
        String refreshToken = savedRt.getToken();
        long         maxAge       = (savedRt.getExpiryDate().toEpochMilli() - System.currentTimeMillis()) / 1000; //쿠키 유효시간

        String cookie = String.format(
                "refreshToken=%s; Domain=.seoul-mate.co.kr; Path=/; Max-Age=%d; HttpOnly; Secure; SameSite=None",
                refreshToken,
                maxAge
        );
        res.setHeader("Set-Cookie", cookie);


        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String,String> body = Map.of(
                "accessToken", accessToken
        );
        objectMapper.writeValue(res.getWriter(), body);

//        String redirectTo = UriComponentsBuilder
//                .fromUriString("http://localhost:3000/savetoken")
//                .queryParam("accessToken", accessToken)
//                .build().toUriString();
//        res.sendRedirect(redirectTo);
    }
}



