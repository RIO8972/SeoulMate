package com.knu.oauthlogin.controller;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@RestController
@Slf4j
public class TestController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/controller")
    public String test() {
        log.info("dd");
        return "test";
    }

    @GetMapping("/db-test")
    public String testDbConnection() {
        try (Connection conn = dataSource.getConnection()) {
            return "DB 연결 성공!";
        } catch (SQLException e) {
            return "DB 연결 실패: " + e.getMessage();
        }
    }

}
