package com.example.Auth.UserService.security;

import com.example.Auth.UserService.entity.UserRegistration;
import com.example.Auth.UserService.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "mysecretkeymysecretkeymysecretkeymysecretkey");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600000L);
    }

    @Test
    void generatedTokenContainsUserIdentityAndValidates() {
        UserRegistration user = new UserRegistration(
                42L,
                "Founder",
                "founder@example.com",
                "password",
                Role.ROLE_FOUNDER,
                LocalDateTime.now(),
                true
        );

        String token = jwtUtil.generateToken(user);

        assertTrue(jwtUtil.validateToken(token));
        assertEquals("founder@example.com", jwtUtil.extractEmail(token));
    }

    @Test
    void validateTokenReturnsFalseForInvalidToken() {
        assertFalse(jwtUtil.validateToken("invalid"));
    }
}
