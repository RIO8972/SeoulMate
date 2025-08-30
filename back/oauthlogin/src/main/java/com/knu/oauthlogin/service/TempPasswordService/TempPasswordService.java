package com.knu.oauthlogin.service.TempPasswordService;

import com.knu.oauthlogin.domain.EmailVerification.EmailVerification;
import com.knu.oauthlogin.domain.EmailVerification.EmailVerificationRepository;
import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import com.knu.oauthlogin.service.token.RefreshTokenService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
@Slf4j
@Service
@RequiredArgsConstructor
public class TempPasswordService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final EmailVerificationRepository evRepo;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    /** 1) 이메일로 6자리 인증코드 전송 (항상 OK 응답: 존재여부 노출 방지) */
    @Transactional
    public void sendEmailCode(String email) {
        // 로컬 계정만 대상
        Optional<User> userOpt = userRepository.findByEmailAndProvider(email, "LOCAL");
        if (userOpt.isEmpty()) {
            log.info("sendEmailCode - no LOCAL user for {}", email);
            return; // 존재여부 숨김
        }

        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        byte[] codeHash = sha256(code);

        EmailVerification ev = EmailVerification.builder()
                .email(email)
                .codeHash(codeHash)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        evRepo.save(ev);

        sendMail(email,
                "[SeoulMate] 비밀번호 재설정 인증코드",
                "인증코드: <b>" + code + "</b><br/>30분 내에 입력해주세요.<br/>" +
                        "본인이 요청한 것이 아니라면 이 메일을 무시하세요.");
    }

    /** 2) 코드 검증 후 임시 비밀번호 발급/적용 */
    @Transactional
    public void issueTempPassword(String email, String code) {
        EmailVerification ev = evRepo.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("invalid"));

        if (ev.isUsed() || ev.isExpired())
            throw new IllegalArgumentException("invalid");
        if (!constantTimeEquals(ev.getCodeHash(), sha256(code)))
            throw new IllegalArgumentException("invalid");

        User user = userRepository.findByEmailAndProvider(email, "LOCAL")
                .orElseThrow(() -> new IllegalArgumentException("invalid"));

        String temp = genTempPassword(13);
        user.setPassword(passwordEncoder.encode(temp));

        ev.setUsedAt(LocalDateTime.now());

        // 기존 RefreshToken 무효화(당신 구현에 맞게) ==> 나중에 추가하기
//        try {
//            refreshTokenService.deleteByUserId(user.getId()); // 없으면 revokeAllForUser 등으로
//        } catch (Exception ignore) {}

        sendMail(email,
                "[SeoulMate] 임시 비밀번호 안내",
                "임시 비밀번호: <b>" + temp + "</b><br/>" +
                        "로그인 후 설정 페이지에서 반드시 비밀번호를 변경해주세요.");
    }

    /* ===== util ===== */
    private void sendMail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true); // HTML
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("메일 전송 실패", e);
        }
    }

    private static byte[] sha256(String s) {
        try { return MessageDigest.getInstance("SHA-256")
                .digest(s.getBytes(StandardCharsets.UTF_8)); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
    private static boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a == null || b == null || a.length != b.length) return false;
        int r = 0; for (int i=0;i<a.length;i++) r |= (a[i] ^ b[i]); return r == 0;
    }
    private static String genTempPassword(int len) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder(len);
        for (int i=0;i<len;i++) sb.append(chars.charAt(r.nextInt(chars.length())));
        return sb.toString();
    }
}
