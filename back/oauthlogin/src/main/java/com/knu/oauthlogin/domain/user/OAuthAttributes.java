package com.knu.oauthlogin.domain.user;

import com.knu.oauthlogin.dto.user.UserProfile;

import java.util.Map;

import java.util.Arrays; //배열을 스트림으로 변환하기 위해서
import java.util.Map; // attribute가 Map<String, Object> 타입이기에 처리를 위해서
import java.util.function.Function;
public enum OAuthAttributes {

    GOOGLE("google", (attribute) -> {
        UserProfile userProfile = new UserProfile();
        userProfile.setUserName((String)attribute.get("name"));
        userProfile.setEmail((String)attribute.get("email"));

        return userProfile;
    }),

    NAVER("naver", (attribute) -> {
        UserProfile userProfile = new UserProfile();
        Map<String, String> responseValue = (Map)attribute.get("response");
        userProfile.setUserName(responseValue.get("name"));
        userProfile.setEmail(responseValue.get("email"));
        return userProfile;
    }),

    KAKAO("kakao", (attribute) -> {
        Map<String, Object> account = (Map)attribute.get("kakao_account");
        Map<String, String> profile = (Map)account.get("profile");
        UserProfile userProfile = new UserProfile();
        userProfile.setUserName(profile.get("nickname"));
        userProfile.setEmail((String)account.get("email"));
        return userProfile;
    });

    private final String registrationId;
    private final Function<Map<String, Object>, UserProfile> of; // 로그인한 사용자의 정보를 통하여 UserProfile을 가져옴

    OAuthAttributes(String registrationId, Function<Map<String, Object>, UserProfile> of) { //생성자
        this.registrationId = registrationId;
        this.of = of;
    }

    public static UserProfile extract(String registrationId, Map<String, Object> attributes) {
        return Arrays.stream(values())
                .filter(value -> registrationId.equals(value.registrationId))
                .findFirst()
                .orElseThrow(IllegalArgumentException::new)
                .of.apply(attributes);
    }
}
