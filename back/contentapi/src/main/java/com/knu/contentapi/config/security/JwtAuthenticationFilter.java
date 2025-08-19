package com.knu.contentapi.config.security;

import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.domain.users.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider tokenProvider;
    private final UserRepository   userRepo;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   UserRepository userRepo) {
        this.tokenProvider = tokenProvider;
        this.userRepo      = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (tokenProvider.validateToken(token)) {
                Long userId = tokenProvider.getUserId(token);
                User user = userRepo.findById(userId)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
                // 인증 객체 생성 (권한이 있다면 부여)
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(req, res);
    }
}

