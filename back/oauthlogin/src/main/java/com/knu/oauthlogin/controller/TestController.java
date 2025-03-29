package com.knu.oauthlogin.controller;

import com.knu.oauthlogin.domain.User;
import com.knu.oauthlogin.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@Controller
@Slf4j
@RequiredArgsConstructor
public class TestController {
    private final UserRepository userRepository;

    @GetMapping("/controller")
    public String test() {
        //userRepository.save(new User("rio"));
        log.info(userRepository.findById(1L).toString()); //추가한부분
        return "test";
    }
}
