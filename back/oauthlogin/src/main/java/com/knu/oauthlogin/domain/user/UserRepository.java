package com.knu.oauthlogin.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findUserByEmailAndProvider(String email, String provider);
    Optional<User> findUserByEmail(String email); //X
    Optional<User> findByEmail(String email);
    Optional<User> findByProvider(String provider);
    Optional<User> findByEmailAndProvider(String email, String provider);
    boolean existsByEmail(String email);
}
