package com.knu.oauthlogin.service.auth;

import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            User u = userRepository.findByEmailAndProvider(email, "LOCAL")
                    .orElseThrow(() -> {
                        log.warn("Local login failed: user not found [{}]", email);
                        return new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email);
                    });
            log.info(">>local_findUser success for [{}]", email);
            return org.springframework.security.core.userdetails.User
                    .withUsername(u.getEmail())
                    .password(u.getPassword())
                    .roles("USER")
                    .build();

        } catch (UsernameNotFoundException ex) {
            // 사용자 없을 때는 그대로 던지고
            throw ex;
        } catch (Exception ex) {
            // 그 외 예기치 않은 오류는 InternalAuthenticationServiceException 으로 감싸서 던집니다
            log.error("Error loading user details for [{}]: {}", email, ex.getMessage(), ex);
            throw new org.springframework.security.authentication.
                    InternalAuthenticationServiceException("사용자 정보 로딩 중 오류가 발생했습니다", ex);
        }
    }
}
