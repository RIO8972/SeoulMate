package com.knu.oauthlogin.service.auth;


import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.dto.user.SignupRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void register(SignupRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }
        User user = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .provider("LOCAL")//AuthProvider.LOCAL
                .build();
        userRepository.save(user);
    }
}
