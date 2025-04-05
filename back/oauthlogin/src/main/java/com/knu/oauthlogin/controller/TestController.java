package com.knu.oauthlogin.controller;

import com.knu.oauthlogin.domain.user.User;
import com.knu.oauthlogin.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
@Slf4j
@RequiredArgsConstructor
public class TestController {
    private final UserRepository userRepository;

    @GetMapping("/controller")
    public String test(Model model) { //test

        //User user = userRepository.findById(1L).get();
        //log.info(user.toString());
        model.addAttribute("username","kang");
        return "test";
    }
}
