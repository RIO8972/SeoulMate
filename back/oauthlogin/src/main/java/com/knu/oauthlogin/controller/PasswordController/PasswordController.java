package com.knu.oauthlogin.controller.PasswordController;

import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.dto.user.PasswordChangeRequest;
import com.knu.oauthlogin.service.TempPasswordService.TempPasswordService;
import com.knu.oauthlogin.service.passwordCange.PasswordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth/password")
public class PasswordController {

    private final TempPasswordService tempPasswordService;
    private final UserRepository userRepository;
    private final PasswordService passwordService;

    /** 이메일로 인증코드 보내기 */
    @PostMapping("/email-code")
    public ResponseEntity<Void> emailCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        tempPasswordService.sendEmailCode(email);
        return ResponseEntity.ok().build(); // 존재여부와 무관하게 OK
    }

    /** 코드 검증 후 임시 비밀번호 발급 */
    @PostMapping("/issue-temp")
    public ResponseEntity<Void> issueTemp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code  = body.get("code");
        tempPasswordService.issueTempPassword(email, code);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/change")
    public ResponseEntity<?> change(
            // principal 이름을 이메일로 사용 중이라는 가정(필요시 커스텀 Principal 써도 됨)
            @AuthenticationPrincipal String email,
            @Valid @RequestBody PasswordChangeRequest req
    ) {
        log.info("Password change request: principalEmail={}", email); // ★ 여기
        if (!req.getNewPassword().equals(req.getConfirmNewPassword())) {
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("error", "새 비밀번호 확인이 일치하지 않습니다."));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));

        passwordService.changeLocalPassword(user, req.getCurrentPassword(), req.getNewPassword());

        return ResponseEntity.ok(Map.of(
                "message", "비밀번호가 변경되었습니다. 다시 로그인해 주세요."
        ));
    }
}
