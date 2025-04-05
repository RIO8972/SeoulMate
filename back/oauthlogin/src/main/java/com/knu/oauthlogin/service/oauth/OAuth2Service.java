package com.knu.oauthlogin.service.oauth;

import com.knu.oauthlogin.domain.user.OAuthAttributes;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.dto.user.UserProfile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2Service implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private final UserRepository userRepository;
    public String getCurrentUser() { //현재 사용자 정보를 가져오는 메서드
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            return oAuth2User.getAttribute("email");
            //return (OAuth2User) authentication.getPrincipal();
        }
        return null;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {//OAuth2UserRequest 객체는 인증 요청에 대한 정보를 담고 있는 객ㅊ[
        OAuth2UserService oAuth2UserService = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = oAuth2UserService.loadUser(userRequest);//loadUser(userRequest)메서드 호출하면
        String registrationId = userRequest.getClientRegistration().getRegistrationId(); //로그인을 수행한 서비스의 이름(google/ naver/ kakao ..)

        String userNameAttributeName = userRequest
                .getClientRegistration()//어떤 서비스(예: Google, Naver, Kakao)에서 로그인했는지에 대한 정보를 담고 있음
                .getProviderDetails()//해당 OAuth2 제공자에 대한 세부 정보를 반환 (제공자(예: Google, Naver, Kakao)의 정보가 포함
                .getUserInfoEndpoint() //OAuth2 제공자에서 사용자 정보를 가져오는 엔드포인트에 대한 정보를 제공. OAuth2 제공자는 특정 URL을 통해 사용자의 정보를 반환
                .getUserNameAttributeName(); //  어떤 필드가 해당 사용자의 고유 식별자인지 반환  Google의 경우 sub(subject)가 주로 사용되며, Naver는 id나 email

        //확인용 로그
        log.info(">>>>>registrationId:"+registrationId
                +"------- userNameAttributeName:"+userNameAttributeName);

        Map<String, Object> attributes = oAuth2User.getAttributes();

        UserProfile userProfile = OAuthAttributes.extract(registrationId, attributes);
        userProfile.setProvider(registrationId); //서비스 해당 식별자 저장 ex) "google", "navar", "kakao"

        updateOrSaveUser(userProfile);

        Map<String, Object> customAttribute =
                getCustomAttribute(registrationId, userNameAttributeName, attributes, userProfile);

        // oauth인증 성공 시 위에서 커스텀한 데이터들과 권한 표현 객체를 추가한 DefaultOAuth2User객체를 반환
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("USER")), //SimpleGrantedAuthority는 권한 표현을 위한 객체
                customAttribute,//커스텀 사용자 정보 (map 형태
                userNameAttributeName); //userNameAttributeName => primary key(식별자)
    }

    public Map getCustomAttribute(String registrationId,
                                  String userNameAttributeName,
                                  Map<String, Object> attributes,
                                  UserProfile userProfile) {

        Map<String, Object> customAttribute = new ConcurrentHashMap<>();

        customAttribute.put(userNameAttributeName, attributes.get(userNameAttributeName));
        customAttribute.put("provider", registrationId);
        customAttribute.put("name", userProfile.getUsername());
        customAttribute.put("email", userProfile.getEmail());

        //map 반환
        return customAttribute;
    }

    public User updateOrSaveUser(UserProfile userProfile) {
        User user = userRepository
                .findUserByEmailAndProvider(userProfile.getEmail(), userProfile.getProvider()) //사용자 조회
                .map(value -> value.updateUser(userProfile.getUsername(), userProfile.getEmail()))//사용자 데이터 최신화
                //2-2. 값이 없다면? -> 새로운 사용자 등록
                .orElse(userProfile.toEntity());
        return userRepository.save(user);
    }
}

