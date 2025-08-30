package com.knu.oauthlogin.controller.PasswordController;

import com.knu.oauthlogin.service.TempPasswordService.TempPasswordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth/password")
public class PasswordController {

    private final TempPasswordService tempPasswordService;

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
}
