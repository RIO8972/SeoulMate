package com.knu.contentapi.controller.Users;


import com.knu.contentapi.config.security.JwtTokenProvider;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.domain.users.UserRepository;
import com.knu.contentapi.dto.review.ReviewUpdateRequestDto;
import com.knu.contentapi.dto.users.UserProfileDto;
import com.knu.contentapi.dto.users.UserUpdateRequestDto;
import com.knu.contentapi.service.users.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;


@RestController
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {
    private final JwtTokenProvider jwtProvider;
    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getMyProfile(
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        if (!jwtProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = jwtProvider.getUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        UserProfileDto dto = new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getImgUrl()
        );
        return ResponseEntity.ok(dto);
    }

    @PatchMapping(value = "/me/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateUserImage(
            @AuthenticationPrincipal User user,
            @RequestPart(value = "image", required = false) MultipartFile image
            ) {

        userService.updateUserImage(user, image);
        return ResponseEntity.ok("ok");
    }

    @PatchMapping(value = "/me/name", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateUserName(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> dto
    ) {
        String username = dto.get("username"); // 키 체크 필요
        userService.updateUserName(user, username);
        return ResponseEntity.ok("ok");
    }
}
